import React, { useRef, useEffect, useState, forwardRef } from 'react'; 
import './CameraStream.css'; 

// Use forwardRef para receber a ref do pai (App.jsx)
const CameraStream = forwardRef((props, ref) => { 
  
  const [error, setError] = useState(null);
  // NOVO: Usamos uma ref interna para armazenar o objeto MediaStream
  const mediaStreamRef = useRef(null); 

  useEffect(() => {
    const startCamera = async () => {
      setError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Guarda o stream na ref interna para poder pará-lo depois
        mediaStreamRef.current = stream; 

        // Conecta o stream ao elemento <video> via ref passada pelo App.jsx
        if (ref.current) { 
          ref.current.srcObject = stream;
          ref.current.onloadedmetadata = () => {
            ref.current.play();
          };
        }
      } catch (err) {
        console.error("Erro ao acessar a câmera:", err);
        setError('Acesso à câmera negado ou indisponível.');
      }
    };

    startCamera();

    // FUNÇÃO DE LIMPEZA CRÍTICA:
    // Esta função é executada quando o componente CameraStream é desmontado (quando isCameraOn muda para false)
    return () => {
      const currentStream = mediaStreamRef.current;
      if (currentStream) {
        // Itera sobre todas as trilhas (vídeo, áudio) e as encerra
        currentStream.getTracks().forEach(track => {
          track.stop();
          console.log(`Trilha de mídia ${track.kind} parada.`);
        });
        mediaStreamRef.current = null; // Limpa a referência
        console.log("Câmera desligada (LED deve apagar).");
      }
    };
  }, [ref]); // Dependências: Roda na montagem e se a ref mudar (improvável)

  return (
    <div className="camera-container">
      {error ? (
        <div className="camera-error">
          <p>⚠️ {error}</p>
        </div>
      ) : (
        // O elemento <video> usa a ref passada pelo pai
        <video ref={ref} autoPlay playsInline muted className="video-element" /> 
      )}
    </div>
  );
}); 

export default CameraStream;