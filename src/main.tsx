import { StrictMode } from 'react'; {/*Жорсткий режим для виєвлення потенційних помилок*/}
import { createRoot } from 'react-dom/client'; {/*createRoot - функція для об'єдання React і index.html*/}
import './index.css'; {/*Всі стилі css*/}
import App from './App.tsx'; {/*Фунція App з усім вмістом*/}

// Точка входу React: #root у index.html є контейнером усього застосунку.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
