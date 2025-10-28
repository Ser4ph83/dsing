// src/components/CameraStream.jsx
import React, { useRef, useEffect, useState } from 'react';
import './CameraStream.css'; // Vamos criar um CSS para ele

const CameraStream = () => {
  // 1. Usamos useRef para referenciar diretamente o elemento <video> no DOM.
  const videoRef = useRef(null);

  // 2. Usamos useState para gerenciar erros e feedback para o usuário.
  const [error, setError] = useState(null);

  useEffect(() => {
    // Função assíncrona para iniciar o stream da câmera
    const startCamera = async () => {
      // 1. Verifica se o navegador suporta a API de mídia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Seu navegador não suporta acesso à câmera.');
        return;
      }

      try {
        // 2. Tenta obter o stream de vídeo
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true, // Solicita acesso ao vídeo
        });

        // 3. Conecta o stream ao elemento <video>
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // O play() deve ser chamado após o carregamento do metadata
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
          };
        }
      } catch (err) {
        // 4. Trata erros como permissão negada
        console.error("Erro ao acessar a câmera:", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Permissão de acesso à câmera negada. Verifique as configurações do seu navegador.');
        } else if (err.name === 'NotFoundError') {
          setError('Nenhuma câmera encontrada no dispositivo.');
        } else {
          setError(`Ocorreu um erro: ${err.message}`);
        }
      }
    };

    startCamera();

    // 5. Cleanup Function: Para parar o stream ao desmontar o componente
    return () => {
      const stream = videoRef.current ? videoRef.current.srcObject : null;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // O array vazio garante que o efeito rode apenas uma vez (ao montar)

  return (
    <div className="camera-container">
      {error ? (
        // Exibe a mensagem de erro se houver
        <div className="camera-error">
          <p>⚠️ {error}</p>
        </div>
      ) : (
        // Elemento <video> onde o stream será exibido
        // A propriedade 'autoPlay' é redundante aqui, mas ajuda.
        // 'playsInline' é crucial para dispositivos móveis.
        <video ref={videoRef} autoPlay playsInline className="video-element" />
      )}
    </div>
  );
};

export default CameraStream;