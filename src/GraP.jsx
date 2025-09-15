import React, { useEffect, useRef, useState } from 'react';
import Logo from "/images/P_WORD_GAME_LOGO.png";
import words from "./words.json"

// Single-file React component implementing the described game.
// Tailwind CSS classes are used for styling (no import required here when used in a project
// configured with Tailwind). Default-exported component.

const DEFAULT_WORDS = words

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function GraP() {
  // game setup state
  const [players, setPlayers] = useState([]); // {name, team: 0|1}
  const [nameInput, setNameInput] = useState('');
  const [roundSeconds, setRoundSeconds] = useState(60);
  const [showSetup, setShowSetup] = useState(true);
  const [waitingForReady, setWaitingForReady] = useState(false);

  // game play state
  const [words, setWords] = useState(() => shuffle(DEFAULT_WORDS));
  const [wordIndex, setWordIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(roundSeconds);
  const [scores, setScores] = useState([0, 0]);
  const [currentTeamTurn, setCurrentTeamTurn] = useState(0); // 0 or 1
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState([0,0]); // index in each team
  const timerRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [turnsPlayed, setTurnsPlayed] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    setTimeLeft(roundSeconds);
  }, [roundSeconds]);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            endRound();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [running]);

  function addPlayer() {
    const name = nameInput.trim();
    if (!name) return;
    setPlayers(p => [...p, { name }]);
    setNameInput('');
  }

  function removePlayer(i) {
    setPlayers(p => p.filter((_, idx) => idx !== i));
  }

  function randomizeTeams() {
    const shuffled = shuffle(players);
    const half = Math.ceil(shuffled.length / 2);
    const newPlayers = shuffled.map((p, idx) => ({ ...p, team: idx < half ? 0 : 1 }));
    setPlayers(newPlayers);
  }

  function playersByTeam(team) {
    return players.filter(p => p.team === team);
  }

  function startGame() {
    if (playersByTeam(0).length === 0 || playersByTeam(1).length === 0) {
      alert('Obie drużyny muszą mieć przynajmniej jednego gracza.');
      return;
    }
    setWords(w => w.length ? w : shuffle(DEFAULT_WORDS));
    setWordIndex(0);
    setScores([0,0]);
    setCurrentTeamTurn(0);
    setCurrentPlayerIndex([0,0]);
    setTimeLeft(roundSeconds);
    setHistory([]);
    setShowSetup(false);
    setWaitingForReady(true);
    setGameOver(false);
    setTurnsPlayed(0);
  }

  function markReady() {
    setWaitingForReady(false);
    setRunning(true);
  }

  function backToSetup() {
    clearInterval(timerRef.current);
    setRunning(false);
    setShowSetup(true);
    setWaitingForReady(false);
    setGameOver(false);
  }

  function endRound() {
    // stop timer, switch team and advance player pointer for team whose turn ended
    setRunning(false);
    setHistory(h => [...h, { type: 'round_end', team: currentTeamTurn, timeLeft }]);
    setTurnsPlayed(t => {
      const newTurns = t + 1;
      if (newTurns >= players.length) {
        setGameOver(true);
      }
      return newTurns;
    });
    // advance player index for current team
    setCurrentPlayerIndex(([a,b]) => {
      const teamPlayers = playersByTeam(currentTeamTurn);
      const nextIdx = (currentTeamTurn === 0 ? a : b) + 1;
      if (currentTeamTurn === 0) return [nextIdx % Math.max(1, teamPlayers.length), b];
      return [a, nextIdx % Math.max(1, teamPlayers.length)];
    });
    // switch team
    setCurrentTeamTurn(t => 1 - t);
    setWaitingForReady(true);
  }

  function nextWord() {
    setWords(w => {
      if (wordIndex + 1 >= w.length) {
        const newShuffled = shuffle(DEFAULT_WORDS.concat(w));
        setWordIndex(0);
        return newShuffled;
      }
      return w;
    });
    setWordIndex(i => (i + 1) % Math.max(1, words.length));
  }

  function handleCorrect() {
    setScores(s => {
      const copy = s.slice();
      copy[currentTeamTurn] += 2;
      return copy;
    });
    setHistory(h => [...h, { type: 'correct', team: currentTeamTurn, word: words[wordIndex] }]);
    nextWord();
  }

  function handleSkip() {
    setScores(s => {
      const copy = s.slice();
      copy[currentTeamTurn] -= 1;
      return copy;
    });
    setHistory(h => [...h, { type: 'skip', team: currentTeamTurn, word: words[wordIndex] }]);
    nextWord();
  }

  function toggleRunning() {
    if (running) {
      clearInterval(timerRef.current);
      setRunning(false);
    } else {
      setRunning(true);
    }
  }

  function manualNextTurn() {
    // allow players to end early and pass turn
    clearInterval(timerRef.current);
    endRound();
  }

  function resetGame() {
    clearInterval(timerRef.current);
    setRunning(false);
    setScores([0,0]);
    setWords(shuffle(DEFAULT_WORDS));
    setWordIndex(0);
    setTimeLeft(roundSeconds);
    setHistory([]);
    setCurrentPlayerIndex([0,0]);
    setCurrentTeamTurn(0);
    setWaitingForReady(false);
    setGameOver(false);
    setTurnsPlayed(0);
  }

  const team0 = playersByTeam(0);
  const team1 = playersByTeam(1);
  const curPlayerForTeam = (team) => {
    const list = playersByTeam(team);
    if (!list.length) return { name: '—' };
    const idx = team === 0 ? currentPlayerIndex[0] : currentPlayerIndex[1];
    return list[idx % list.length];
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-6">
      <div className="max-w-4xl w-full mx-auto">
        <header className="mb-6">
  <img 
    src={Logo}
    alt="Logo P Word Game" 
    className="mx-auto mb-4 w-24 h-24 object-contain" 
  />
  {showSetup && (
    <>
    <h1 className="text-3xl font-bold">Gra: "Tylko słowa na P" (wersja mobilna)</h1>
  <p className="text-sm text-gray-600 mt-1">
    Jedno urządzenie, naprzemienne tury drużyn. Opisywać można tylko słowami zaczynającymi się na literę "P".
  </p>
    </>
  )}
</header>

        <section className="grid md:grid-cols-2 gap-6">
          {showSetup && (
          <div className="bg-white p-4 rounded-2xl shadow">
            <h2 className="font-semibold mb-2">Gracze i drużyny</h2>
            <div className="flex gap-2 mb-3">
              <input className="flex-1 p-2 border rounded" placeholder="Imię gracza" value={nameInput} onChange={e => setNameInput(e.target.value)} />
              <button className="p-2 bg-blue-600 text-white rounded" onClick={addPlayer}>Dodaj</button>
            </div>

            <div className="mb-4">
              <h3 className="font-medium">Lista graczy:</h3>
              <ul className="mt-2 space-y-1">
                {players.map((p, i) => (
                  <li key={i} className="flex justify-between items-center">
                    <span>{p.name}</span>
                    <button className="text-sm text-red-600" onClick={() => removePlayer(i)}>usuń</button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <h3 className="font-medium">Drużyna A</h3>
                <ul className="mt-2 space-y-1">
                  {team0.map((p, i) => (
                    <li key={i} className="flex justify-between items-center">
                      <span>{p.name}</span>
                      <button className="text-sm text-red-600" onClick={() => removePlayer(players.indexOf(p))}>usuń</button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Drużyna B</h3>
                <ul className="mt-2 space-y-1">
                  {team1.map((p, i) => (
                    <li key={i} className="flex justify-between items-center">
                      <span>{p.name}</span>
                      <button className="text-sm text-red-600" onClick={() => removePlayer(players.indexOf(p))}>usuń</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded" onClick={randomizeTeams}>Wylosuj drużyny</button>

            <div className="mt-4">
              <h3 className="font-medium">Czas trwania rundy</h3>
              <div className="flex gap-2 mt-2">
                {[60,90,120].map(s => (
                  <button key={s} className={`px-3 py-1 rounded ${roundSeconds===s? 'bg-green-600 text-white':'border'}`} onClick={() => setRoundSeconds(s)}>{s}s</button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded mr-2" onClick={startGame}>Start</button>
              {/* <button className="px-4 py-2 border rounded" onClick={resetGame}>Reset</button> */}
            </div>

          </div>
          )}

          {!showSetup && gameOver && (
            <div className="bg-white p-6 rounded-2xl shadow flex flex-col items-center justify-center">
              <h2 className="font-semibold mb-4 text-center text-2xl">Koniec gry</h2>
              <div className="grid grid-cols-2 gap-6 w-full max-w-md mb-6">
                <div className="p-4 rounded border bg-gray-50 text-center">
                  <h3 className="text-lg font-semibold mb-2">Drużyna A</h3>
                  <p className="text-3xl font-bold">{scores[0]}</p>
                  <ul className="mt-2 text-sm">
                    {team0.map((p, i) => <li key={i}>{p.name}</li>)}
                  </ul>
                </div>
                <div className="p-4 rounded border bg-gray-50 text-center">
                  <h3 className="text-lg font-semibold mb-2">Drużyna B</h3>
                  <p className="text-3xl font-bold">{scores[1]}</p>
                  <ul className="mt-2 text-sm">
                    {team1.map((p, i) => <li key={i}>{p.name}</li>)}
                  </ul>
                </div>
              </div>
              <button className="px-6 py-3 bg-indigo-600 text-white rounded" onClick={backToSetup}>Powrót do ustawień</button>
            </div>
          )}

          {!showSetup && !waitingForReady && !gameOver && (
          <div className="bg-white p-4 rounded-2xl shadow">
            <h2 className="font-semibold mb-2">Stan gry</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded border">
                <h3 className="text-lg">Drużyna A</h3>
                <p className="text-2xl font-bold">{scores[0]}</p>
                <p className="text-sm mt-1">Gracz: {curPlayerForTeam(0).name}</p>
              </div>
              <div className="p-3 rounded border">
                <h3 className="text-lg">Drużyna B</h3>
                <p className="text-2xl font-bold">{scores[1]}</p>
                <p className="text-sm mt-1">Gracz: {curPlayerForTeam(1).name}</p>
              </div>
            </div>

            <div className="mt-4 p-3 rounded border bg-gray-50">
              <p className="text-sm">Aktualna tura: <strong>{currentTeamTurn===0? 'Drużyna A' : 'Drużyna B'}</strong></p>
              <p className="text-sm">Aktualny gracz: <strong>{curPlayerForTeam(currentTeamTurn).name}</strong></p>
              <p className="text-sm">Czas: <strong>{timeLeft}s</strong> {running? <span className="ml-2 text-green-600">(running)</span>:<span className="ml-2 text-red-600">(stopped)</span>}</p>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600 mb-2">Słowo (wyświetlane tylko prowadzącemu):</p>
                <div className="text-2xl font-bold text-center py-4">{words[wordIndex] || '—'}</div>
                <p className="text-xs text-gray-500 text-center">Po odgadnięciu naciśnij "Poprawne" (+2). Jeśli pomijają — "Pominięte" (-1).</p>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded" onClick={handleCorrect} disabled={!running}>Poprawne (+2)</button>
                <button className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded" onClick={handleSkip} disabled={!running}>Pominięte (-1)</button>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 border rounded" onClick={toggleRunning}>{running ? 'Pauza' : 'Start/Powróć'}</button>
                <button className="flex-1 px-3 py-2 border rounded" onClick={manualNextTurn}>Koniec tury (przejdź)</button>
              </div>

              <div className="mt-4">
                <button className="px-4 py-2 border rounded w-full" onClick={backToSetup}>Powrót do ustawień</button>
              </div>

            </div>

          </div>
          )}

          {!showSetup && waitingForReady && !gameOver && (
            <div className="bg-white p-4 rounded-2xl shadow flex flex-col items-center justify-center">
              <h2 className="font-semibold mb-4 text-center">Podpowiada teraz: <span className="text-lg font-bold">{curPlayerForTeam(currentTeamTurn).name}</span></h2>
              <button className="px-6 py-3 bg-indigo-600 text-white rounded" onClick={markReady}>Gotowy</button>
            </div>
          )}
        </section>

        {!showSetup && (
        <section className="mt-6 bg-white p-4 rounded-2xl shadow">
          <h2 className="font-semibold mb-2">Historia akcji</h2>
          <div className="max-h-48 overflow-auto text-sm">
            {history.length===0 ? <p className="text-gray-500">Brak akcji jeszcze.</p> : (
              <ul className="space-y-1">
                {history.slice().reverse().map((h, i) => (
                  <li key={i} className="border-b py-1">
                    {h.type==='correct' && (<span>+2: Drużyna {h.team===0? 'A' : 'B'} — słowo <strong>{h.word}</strong></span>)}
                    {h.type==='skip' && (<span>-1: Drużyna {h.team===0? 'A' : 'B'} — pominięte <strong>{h.word}</strong></span>)}
                    {h.type==='round_end' && (<span>~ Koniec rundy dla drużyny {h.team===0? 'A' : 'B'} (zostało {h.timeLeft}s)</span>)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 text-xs text-gray-600">Wskazówka: aplikacja nie słucha mowy — uczciwość prowadzącego jest wymagana (prowadzący ma za zadanie opisywać jedynie słowami na literę "P").</div>
        </section>
        )}

        <footer className="mt-6 text-sm text-gray-500 text-center">Możesz grać na jednym telefonie — przekazuj urządzenie kolejnym graczom na turę.</footer>
      </div>
    </div>
  );
}
