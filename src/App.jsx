import React, { useState, useRef, useCallback } from 'react';
import CameraStream from './components/CameraStream';
import Card from './components/Card';
import DatilologiaProcessor from './components/DatilologiaProcessor';
import './App.css';

function App() {
  // --- Estados e Referências ---
  const [inputText, setInputText] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  const videoRef = useRef(null); 
  const [isCameraOn, setIsCameraOn] = useState(false); 

  // --- Funções de Lógica ---
  
  const appendRecognizedChar = useCallback((char) => {
    setRecognizedText(prevText => prevText + char);
  }, []); 

  const handleClearText = () => {
    setRecognizedText('');
  };
  
  const toggleCamera = () => {
      setIsCameraOn(prev => !prev);
      if (isCameraOn) { 
          setRecognizedText('');
      }
  };

  const handleTranslate = () => {
    if (inputText.trim() === '') {
      console.error('Por favor, digite um texto para traduzir.'); 
      return;
    }

    if (window.accessibility && window.accessibility.sendContent) {
      console.log('VLibras acionado para ler o conteúdo da textarea.');
      window.accessibility.sendContent('textarea-vlibras');

    } else {
      console.error('⚠️ O widget VLibras precisa ser ATIVADO primeiro (clique no ícone no canto).');
    }
  };

  return (
    <>
      <header>
        <h1 className="main-title">🌟 DSign Tradutor de LIBRAS 🌟</h1>
      </header>
      
      <div className="cards-container">
        
        {/* Card da Esquerda: Surdo -> Ouvinte (Datilologia) */}
        <Card title="Surdo-Ouvinte (Datilologia para Texto)">
            
            {/* BOTÃO DE CONTROLE DA CÂMERA */}
            <div className="camera-control-row">
                <button 
                    className={isCameraOn ? "camera-off-button" : "camera-on-button"}
                    onClick={toggleCamera}
                >
                    {isCameraOn ? '🔴 Desligar Câmera' : '🟢 Ligar Câmera'}
                </button>
            </div>
            
            <div className="video-placeholder"> 
                {isCameraOn ? (
                    // Câmera é MONTADA/DESMONTADA aqui, disparando a limpeza do stream
                    <CameraStream ref={videoRef} /> 
                ) : (
                    <div className="camera-off-message">
                        <p>Câmera Desligada. Pressione "Ligar Câmera" para começar a sinalizar.</p>
                    </div>
                )}
            </div> 
            
            {/* O Processador de Datilologia só é ativado quando a câmera está ligada */}
            {isCameraOn && (
                <DatilologiaProcessor 
                    videoStreamRef={videoRef}
                    onTextRecognized={appendRecognizedChar}
                />
            )}

            {/* BOTÃO LIMPAR TEXTO */}
            <div className="action-row">
                <button 
                    className="clear-button"
                    onClick={handleClearText}
                    disabled={recognizedText.length === 0}
                >
                    Limpar Texto
                </button>
            </div>
            
            <div className="result-area">
                <p className="result-text">{recognizedText || "Texto reconhecido aparecerá aqui..."}</p>
            </div>
        </Card>
        
        {/* Card da Direita: Ouvinte -> Surdo (VLibras) */}
        <Card title="Ouvinte-Surdo (Texto para LIBRAS)">
          
          <textarea 
            className="input-textarea"
            id="textarea-vlibras"
            placeholder="Digite sua mensagem para tradução..."
            rows="5"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            data-vlibras
          ></textarea>
          
          <button 
            className="translate-button" 
            onClick={handleTranslate} 
            aria-hidden="true"
          >
            Traduzir para LIBRAS
          </button>
          
          <div className="vlibras-placeholder">
            <p>O avatar VLibras aparecerá no canto da tela.</p>
          </div>
        </Card>
        
      </div>
    </>
  );
}

export default App;