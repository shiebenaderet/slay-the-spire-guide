import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { CharacterSelect } from './pages/CharacterSelect';
import { StartingChoice } from './pages/StartingChoice';
import { RunCoach } from './pages/RunCoach';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CharacterSelect />} />
        <Route path="/starting-choice" element={<StartingChoice />} />
        <Route path="/run-tracker" element={<RunCoach />} />
      </Routes>
    </Router>
  );
}

export default App;
