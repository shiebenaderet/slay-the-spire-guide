import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CharacterSelect } from './pages/CharacterSelect';
import { StartingChoice } from './pages/StartingChoice';
import { MainRunTracker } from './pages/MainRunTracker';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CharacterSelect />} />
        <Route path="/starting-choice" element={<StartingChoice />} />
        <Route path="/run-tracker" element={<MainRunTracker />} />
      </Routes>
    </Router>
  );
}

export default App;
