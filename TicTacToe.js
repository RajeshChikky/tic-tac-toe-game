import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  onValue,
} from "firebase/database";
import QRCode from "react-qr-code";

// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export default function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [roomId, setRoomId] = useState(() => {
    const id = window.location.pathname.slice(1);
    return id || generateRoomId();
  });

  function generateRoomId() {
    const id = Math.random().toString(36).substr(2, 6);
    window.history.pushState({}, "", `/${id}`);
    return id;
  }

  useEffect(() => {
    const roomRef = ref(db, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBoard(data.board || Array(9).fill(null));
        setXIsNext(data.xIsNext ?? true);
        setWinner(data.winner || null);
      }
    });
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    const result = checkWinner(board);
    if (result) {
      setWinner(result);
      updateRoom({ winner: result });
      if (result === "Draw") toast("It's a draw!");
      else toast.success(`${result} wins!`);
    }
  }, [board]);

  const updateRoom = (updates) => {
    const roomRef = ref(db, `rooms/${roomId}`);
    set(roomRef, {
      board,
      xIsNext,
      winner,
      ...updates,
    });
  };

  const handleClick = (i) => {
    if (board[i] || winner) return;
    const newBoard = [...board];
    newBoard[i] = xIsNext ? "X" : "O";
    setBoard(newBoard);
    setXIsNext(!xIsNext);
    updateRoom({ board: newBoard, xIsNext: !xIsNext });
  };

  const checkWinner = (squares) => {
    for (let combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return squares.includes(null) ? null : "Draw";
  };

  const resetGame = () => {
    const emptyBoard = Array(9).fill(null);
    setBoard(emptyBoard);
    setXIsNext(true);
    setWinner(null);
    updateRoom({ board: emptyBoard, xIsNext: true, winner: null });
  };

  const currentUrl = window.location.href;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-800 to-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-6">Tic Tac Toe</h1>
      <p className="mb-2">Share this link with your friend to play:</p>
      <span className="underline text-blue-400 break-words text-center mb-4">{currentUrl}</span>
      <QRCode value={currentUrl} bgColor="#1e293b" fgColor="#ffffff" className="mb-6" />
      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleClick(i)}
            className="w-24 h-24 bg-slate-700 rounded-2xl flex items-center justify-center text-4xl font-bold shadow-lg cursor-pointer transition-colors duration-200 hover:bg-slate-600"
          >
            {cell}
          </motion.div>
        ))}
      </div>
      {winner && (
        <div className="mt-6 text-xl">
          {winner === "Draw" ? "It's a draw!" : `${winner} wins!`}
        </div>
      )}
      <button
        onClick={resetGame}
        className="mt-6 px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl shadow-md text-white font-semibold transition-all duration-200"
      >
        Play Again
      </button>
    </div>
  );
}
