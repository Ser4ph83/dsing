// src/components/MediapipeProcessor.jsx
import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import "./MediapipeProcessor.css";

const MediapipeProcessor = ({
  videoStreamRef,
  isCameraOn,
  onTextRecognized,
  onMessageUpdate,
}) => {
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const labelNamesRef = useRef([]);
  const lastPredictionRef = useRef({ label: "", time: 0 }); // Evita repetição rápida
  const [status, setStatus] = useState("Aguardando câmera...");
  const [collectLabel, setCollectLabel] = useState("");
  const [isCollecting, setIsCollecting] = useState(false);
  const [samples, setSamples] = useState([]);
  const [labels, setLabels] = useState([]);
  const [labelCounts, setLabelCounts] = useState({});
  const [isTraining, setIsTraining] = useState(false);
  const [modelStatus, setModelStatus] = useState("Modelo: nenhum");
  const [showPanel, setShowPanel] = useState(false);

  // ----------- Pré-processamento dos landmarks -----------
  const preprocessLandmarks = (landmarks) => {
    const wrist = landmarks[0];
    const centered = [];
    for (let i = 0; i < landmarks.length; i++) {
      centered.push(landmarks[i].x - wrist.x);
      centered.push(landmarks[i].y - wrist.y);
      centered.push(landmarks[i].z - wrist.z);
    }
    let maxDist = 0;
    for (let i = 0; i < landmarks.length; i++) {
      for (let j = i + 1; j < landmarks.length; j++) {
        const dx = landmarks[i].x - landmarks[j].x;
        const dy = landmarks[i].y - landmarks[j].y;
        const dz = landmarks[i].z - landmarks[j].z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d > maxDist) maxDist = d;
      }
    }
    return centered.map((v) => v / (maxDist || 1));
  };

  // ----------- Inicializa o MediaPipe -----------
  useEffect(() => {
    let hands = null;
    let camera = null;
    let active = true;

    const init = async () => {
      if (!isCameraOn) {
        setStatus("Câmera desligada.");
        return;
      }

      const waitFor = async () => {
        if (window.Hands && window.Camera && window.drawConnectors) return;
        await new Promise((r) => setTimeout(r, 300));
        return waitFor();
      };

      try {
        await waitFor();

        const HandsClass = window.Hands;
        const HAND_CONNECTIONS = window.HAND_CONNECTIONS;
        const Camera = window.Camera;
        const { drawConnectors, drawLandmarks } = window;

        const videoEl = videoStreamRef.current;
        if (!videoEl) return;

        const onResults = (results) => {
          if (!active) return;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

          if (results.multiHandLandmarks?.length) {
            for (const landmarks of results.multiHandLandmarks) {
              drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
                color: "#00FF00",
                lineWidth: 3,
              });
              drawLandmarks(ctx, landmarks, {
                color: "#FF0000",
                lineWidth: 1,
              });

              const processed = preprocessLandmarks(landmarks);
              setStatus("Mão detectada ✋");

              if (isCollecting && collectLabel.trim()) {
                setSamples((p) => [...p, processed]);
                setLabels((p) => [...p, collectLabel]);
                setLabelCounts((p) => ({
                  ...p,
                  [collectLabel]: (p[collectLabel] || 0) + 1,
                }));
              }

              // ----------- Predição com filtro de confiança -----------
              if (modelRef.current && labelNamesRef.current.length > 0) {
                const tensor = tf.tensor2d([processed]);
                const pred = modelRef.current.predict(tensor);
                const probs = pred.arraySync()[0];
                const maxProb = Math.max(...probs);
                const maxIdx = probs.indexOf(maxProb);
                const predicted = labelNamesRef.current[maxIdx];
                const now = Date.now();

                if (
                  maxProb >= 0.96 &&
                  predicted &&
                  predicted !== lastPredictionRef.current.label &&
                  now - lastPredictionRef.current.time > 700
                ) {
                  lastPredictionRef.current = { label: predicted, time: now };
                  onTextRecognized?.(predicted);
                }

                tf.dispose([tensor, pred]);
              }
            }
          } else {
            setStatus("Nenhuma mão detectada.");
          }
        };

        hands = new HandsClass({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
        });
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });
        hands.onResults(onResults);

        camera = new Camera(videoEl, {
          onFrame: async () => await hands.send({ image: videoEl }),
          width: 640,
          height: 480,
        });

        camera.start();
        setStatus("MediaPipe Hands iniciado com sucesso!");
        onMessageUpdate?.("MediaPipe Hands iniciado com sucesso!");
      } catch (err) {
        console.error("Erro ao iniciar MediaPipe:", err);
        setStatus("Erro ao iniciar MediaPipe.");
      }
    };

    init();

    return () => {
      active = false;
      try {
        camera?.stop();
        hands?.close();
      } catch {}
    };
  }, [isCameraOn, isCollecting, collectLabel]);

  // ----------- Carrega modelo salvo automaticamente -----------
  useEffect(() => {
    const tryLoad = async () => {
      try {
        // 1️⃣ tenta carregar do IndexedDB
        const models = await tf.io.listModels();
        if (models["indexeddb://libras-model"]) {
          const m = await tf.loadLayersModel("indexeddb://libras-model");
          modelRef.current = m;
          const lbls = localStorage.getItem("libras-labels");
          if (lbls) labelNamesRef.current = JSON.parse(lbls);
          setModelStatus("✅ Modelo carregado automaticamente (IndexedDB)");
          return;
        }

        // 2️⃣ tenta carregar da pasta public/model/
        const basePath = window.location.hostname.includes("github.io")
          ? "/dsign/model/libras-model.json"
          : "/model/libras-model.json";

        console.log("🔍 Tentando carregar modelo base em:", basePath);
        const m = await tf.loadLayersModel(basePath);
        modelRef.current = m;
        await m.save("indexeddb://libras-model");
        setModelStatus("✅ Modelo base carregado do servidor (pré-treinado)");

        const lbls = localStorage.getItem("libras-labels");
        if (lbls) labelNamesRef.current = JSON.parse(lbls);
      } catch (err) {
        console.error("❌ Erro ao carregar modelo:", err);
        setModelStatus("❌ Nenhum modelo encontrado. Treine ou carregue manualmente.");
      }
    };

    tryLoad();
  }, []);

  // ----------- Funções de controle -----------
  const toggleCollect = () => {
    if (!collectLabel.trim()) return alert("Digite uma letra para coletar.");
    if (!isCameraOn) return alert("Ligue a câmera primeiro.");
    setIsCollecting((p) => !p);
  };

  const downloadDataset = () => {
    if (!samples.length) return alert("Nenhuma amostra coletada!");
    const unique = Array.from(new Set(labels));
    const map = {};
    unique.forEach((l, i) => (map[l] = i));
    const out = { samples, labels: labels.map((l) => map[l]), label_names: unique };
    const blob = new Blob([JSON.stringify(out)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "libras_dataset.json";
    a.click();
  };

  const trainModel = async () => {
    if (!samples.length) return alert("Colete amostras antes de treinar.");
    setIsTraining(true);
    setModelStatus("Treinando...");

    try {
      const xs = tf.tensor2d(samples);
      const unique = Array.from(new Set(labels));
      const map = {};
      unique.forEach((l, i) => (map[l] = i));
      const ysIdx = labels.map((l) => map[l]);
      const ys = tf.oneHot(tf.tensor1d(ysIdx, "int32"), unique.length);

      const model = tf.sequential();
      model.add(tf.layers.dense({ inputShape: [63], units: 128, activation: "relu" }));
      model.add(tf.layers.dense({ units: 64, activation: "relu" }));
      model.add(tf.layers.dense({ units: unique.length, activation: "softmax" }));
      model.compile({ optimizer: "adam", loss: "categoricalCrossentropy", metrics: ["accuracy"] });

      await model.fit(xs, ys, {
        epochs: 25,
        batchSize: 32,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            const l = logs.loss?.toFixed(3) ?? "N/A";
            const a = logs.acc?.toFixed(3) ?? "N/A";
            setModelStatus(`Treinando... Época ${epoch + 1} | Loss: ${l} | Acc: ${a}`);
          },
        },
      });

      await model.save("downloads://libras-model");
      await model.save("indexeddb://libras-model");
      localStorage.setItem("libras-labels", JSON.stringify(unique));
      modelRef.current = model;
      labelNamesRef.current = unique;
      setModelStatus("✅ Modelo treinado e salvo!");
      xs.dispose();
      ys.dispose();
    } catch (e) {
      console.error("Erro no treinamento:", e);
      setModelStatus("Erro no treinamento.");
    } finally {
      setIsTraining(false);
    }
  };

  const loadModel = async (ev) => {
    const files = ev.target.files;
    if (!files?.length) return alert("Selecione os arquivos .json e .bin");
    try {
      const model = await tf.loadLayersModel(tf.io.browserFiles([...files]));
      modelRef.current = model;
      await model.save("indexeddb://libras-model");
      const lbls = localStorage.getItem("libras-labels");
      if (lbls) labelNamesRef.current = JSON.parse(lbls);
      setModelStatus("✅ Modelo carregado e salvo localmente!");
      alert("Modelo carregado com sucesso.");
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar modelo. Selecione .json e .bin juntos.");
    }
  };

  // ----------- Interface -----------
  return (
    <div className="mediapipe-canvas-wrapper">
      <canvas ref={canvasRef} width="640" height="480" />
      <p style={{ textAlign: "center", color: "#444" }}>{status}</p>

      <div className="mediapipe-panel">
        <button onClick={() => setShowPanel((p) => !p)} className="toggle-panel-btn">
          ⚙️ {showPanel ? "Ocultar Configurações" : "Mostrar Configurações de IA"}
        </button>

        {showPanel && (
          <div className="panel-content">
            <h3>Coleta</h3>
            <input
              type="text"
              placeholder="Letra (ex: A)"
              maxLength={2}
              value={collectLabel}
              onChange={(e) => setCollectLabel(e.target.value.toUpperCase())}
            />
            <button onClick={toggleCollect} style={{ marginLeft: 8 }}>
              {isCollecting ? "⏸️ Pausar" : "▶️ Coletar"}
            </button>
            <button
              onClick={downloadDataset}
              style={{ marginLeft: 8 }}
              disabled={!samples.length}
            >
              💾 Baixar Dataset
            </button>

            <div style={{ marginTop: 8 }}>
              {Object.entries(labelCounts).map(([k, v]) => (
                <div key={k}>
                  {k}: {v}
                </div>
              ))}
            </div>

            <hr />
            <h3>Treinar Modelo</h3>
            <button onClick={trainModel} disabled={isTraining || !samples.length}>
              {isTraining ? "Treinando..." : "⚙️ Treinar TF.js"}
            </button>
            <p>{modelStatus}</p>

            <hr />
            <h3>Carregar Modelo</h3>
            <input type="file" accept=".json,.bin" multiple onChange={loadModel} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MediapipeProcessor;
