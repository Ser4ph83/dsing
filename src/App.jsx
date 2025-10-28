// src/App.jsx
import React, { useState } from 'react'; // Importe useState
import CameraStream from './components/CameraStream';
import Card from './components/Card';
import './App.css';

function App() {
  // 1. STATE para o texto do ouvinte
  const [inputText, setInputText] = useState('');

  // 2. Função para lidar com a tradução
  const handleTranslate = () => {
    if (inputText.trim() === '') {
      alert('Por favor, digite um texto para traduzir.');
      return;
    }

    // A mágica: Usamos a API JavaScript do VLibras
    // window.accessibility é o objeto global criado pelo script do VLibras
    if (window.accessibility && window.accessibility.sendContent) {
      
      console.log('VLibras API detectada. Tentando tradução...');

      const contentId = 'vlibras-content-' + Date.now();
      
      // Cria o elemento temporário
      const tempElement = document.createElement('span');
      tempElement.id = contentId;
      tempElement.textContent = inputText;
      tempElement.style.display = 'none'; 
      document.body.appendChild(tempElement);
      
      // Envia o comando
      window.accessibility.sendContent(contentId);

      // Limpa o elemento
      setTimeout(() => {
          document.getElementById(contentId)?.remove();
          console.log(`Elemento temporário ${contentId} removido.`);
      }, 500); // Aumentei o tempo para 500ms para garantir a leitura em ambientes mais lentos
      
  } else {
      // Mensagem mais clara sobre como ativar
      alert('⚠️ O widget VLibras precisa ser ativado primeiro! Clique no ícone de acessibilidade (bonequinho) no canto da tela para iniciar o VLibras.');
      console.error('VLibras API (window.accessibility) não está disponível. Usuário precisa ativar o widget.');
  }
};


  return (
    <>
      <header>
        <h1 className="main-title">🌟 DSign Tradutor de LIBRAS 🌟</h1>
      </header>
      
      <div className="cards-container">
        
        {/* Card da Esquerda (Sem alteração) */}
        <Card title="Surdo-Ouvinte (Datilologia para Texto)">
          <div className="video-placeholder"> 
            <CameraStream /> 
          </div> 
          <div className="result-area">
            <p className="result-text">Texto reconhecido aparecerá aqui...</p>
          </div>
        </Card>
        
        {/* Card da Direita: Ouvinte -> Surdo (VLibras) */}
        <Card title="Ouvinte-Surdo (Texto para LIBRAS)">
          
          <textarea 
            className="input-textarea"
            placeholder="Digite sua mensagem para tradução..."
            rows="5"
            value={inputText} // Conecta o campo ao state
            onChange={(e) => setInputText(e.target.value)} // Atualiza o state
          ></textarea>
          
          <button 
            className="translate-button"
            onClick={handleTranslate} // Chama a função ao clicar
          >
            Traduzir para LIBRAS
          </button>
          
          <div className="vlibras-placeholder">
            {/* O VLibras aparecerá no canto da tela. Esta div pode ser usada para um placeholder visual. */}
            <p>O avatar VLibras aparecerá no canto da tela.</p>
          </div>
        </Card>
        
      </div>
    </>
  );
}

export default App;