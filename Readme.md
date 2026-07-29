# 🤟 dSign — Tradutor de Dactilologia em Libras com Visão Computacional

O **dSign** é uma aplicação web focada em acessibilidade e inclusão, projetada para reconhecer e traduzir o alfabeto dactilológico da Língua Brasileira de Sinais (Libras) em tempo real, utilizando a webcam do usuário.

---

## 🚀 Tecnologias e Frameworks Utilizados

* **Front-end & Build System:**
  * **React:** Construção de interface reativa, modular e acessível.
  * **Vite:** Server de desenvolvimento ultra-rápido e empacotamento otimizado.

* **Visão Computacional & Inteligência Artificial:**
  * **MediaPipe Hands (Google):** Extração e rastreamento em tempo real dos 21 pontos anatômicos (*landmarks*) das mãos diretamente no navegador, garantindo alta performance e baixa latência.
  * **TensorFlow / TensorFlow.js:** Treinamento do modelo de classificação e inferência dos dados de postura da mão para identificação das letras.

---

## 🧠 Arquitetura e Treinamento do Modelo

### A Evolução do Projeto
Inicialmente, a prova de conceito utilizou a plataforma *Teachable Machine*. Contudo, durante os testes de usabilidade, a abordagem baseada na classificação direta de imagens brutas mostrou-se limitada e com latência elevada para processamento direto no navegador.

### A Solução Adotada
Para contornar o gargalo de performance, o pipeline foi reestruturado:
1. **Coleta de Dados:** O modelo foi alimentado com um *dataset* próprio contendo entre **100 a 200 frames por letra**, capturando variações de ângulo e profundidade da dactilologia.
2. **Extração de Vetores:** Em vez de analisar pixels brutos, a aplicação utiliza o **MediaPipe Hands** para extrair as coordenadas numéricas (*landmarks*) dos nós da mão a cada frame da webcam.
3. **Classificação com IA:** Os vetores normalizados são processados via **TensorFlow**, determinando a letra correspondente com alta precisão e baixo consumo de memória.

---

## 💻 Funcionalidades da Interface

* **Captura ao Vivo:** Janela integrada de exibição do fluxo de vídeo da webcam.
* **Processamento no Cliente:** Execução dos algoritmos de IA diretamente no navegador (sem necessidade de enviar vídeo para servidores externos, garantindo privacidade e resposta instantânea).
* **Saída em Texto:** Campo de texto dinâmico que exibe as letras reconhecidas consecutivamente, permitindo a formação de palavras e frases.

---

## 🛠️ Como Executar o Projeto

```bash
# Clone o repositório
git clone [https://github.com/Ser4ph83/dsing.git](https://github.com/Ser4ph83/dsing.git)

# Acesse a pasta do projeto
cd dsing

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
