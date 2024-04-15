import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [pixels, setPixels] = useState(Array(28 * 28).fill(0));
  const drawing = useRef(false);
  const [darkMode, setDarkMode] = useState(false);
  const [prediction, setPrediction] = useState('');
  const [label, setLabel] = useState('');
  const [brushSize, setBrushSize] = useState(2);

  const handleClear = () => {
    setPixels(Array(28 * 28).fill(0));
    setPrediction('');
    setLabel('');
  }

  const distance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  const MAX_BRUSH_OPACITY = 255; // Maximum intensity value for painting

  const getBrushedPixels = (pixels, index, brushSize, maxBrushOpacity) => {
    const newPixels = [...pixels];
    const x = index % 28;
    const y = Math.floor(index / 28);

    for (let i = -brushSize; i <= brushSize; i++) {
      for (let j = -brushSize; j <= brushSize; j++) {
        const distanceFromCenter = distance(0, 0, i, j);
        if (distanceFromCenter > brushSize) continue;

        const brushIntensity = maxBrushOpacity * (1 - (distanceFromCenter / brushSize));
        const xi = x + i;
        const yi = y + j;
        if (xi >= 0 && xi < 28 && yi >= 0 && yi < 28) {
          const pixelIndex = yi * 28 + xi;
          newPixels[pixelIndex] = Math.min(
            maxBrushOpacity,
            newPixels[pixelIndex] + brushIntensity
          );
        }
      }
    }

    return newPixels;
  };

  const handleMouseOver = (index) => {
    if (drawing.current) {
      const newPixels = getBrushedPixels(pixels, index, brushSize, MAX_BRUSH_OPACITY);
      setPixels(newPixels);
    }
  };

  const handleMouseDown = (index) => {
    drawing.current = true;
    const newPixels = getBrushedPixels(pixels, index, brushSize, MAX_BRUSH_OPACITY);
    setPixels(newPixels);
  };

  const handleMouseUp = () => {
    drawing.current = false;
  };

  const handleRandom = () => {
    fetch('http://127.0.0.1:5000/random')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        const newPixels = data.image.flat(); // Flatten the 2D array to a 1D array directly
        setPixels(newPixels.map(value => value * 255)); // Ensure proper scaling if needed
        setLabel(data.label);
        setPrediction('');
      })
      .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
      });
  };

  const handleGuess = () => {
    // Image data must have values from [0, 1] and be in the shape (28, 28, 1)
    const normalizedPixels = pixels.map(value => value / 255);
    const imageData = {
    image: Array.from({ length: 28 }, (_, i) =>
      normalizedPixels.slice(i * 28, i * 28 + 28).map(value => [value])
      ),
    };

    fetch('http://127.0.0.1:5000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imageData)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setPrediction(data.prediction);
      })
      .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
        setPrediction('Error in prediction');
      });
  };

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      <h1>Handwritten Digit Recognition</h1>
      <div className="grid-container" onMouseUp={handleMouseUp}>
        <div className="grid">
          {pixels.map((value, index) => (
            <div
              key={index}
              onMouseDown={() => handleMouseDown(index)}
              onMouseOver={() => handleMouseOver(index)}
              style={{ backgroundColor: `rgb(${darkMode?value: 255-value}, ${darkMode?value: 255-value}, ${darkMode?value: 255-value})` }}
              className="pixel"
            />
          ))}
        </div>
        <p className="true-label">True Label: {label !== '' ? label : "unknown"}</p>
      </div>
      <div className="buttons">
        <button onClick={handleClear}>Clear</button>
        <button onClick={handleRandom}>Random</button>
        <button onClick={handleGuess}>Predict</button>
      </div>
      <p className="prediction">Model prediction: {prediction}</p>
      <div className="brush-size">
        <label>Brush size: {brushSize}</label>
        <input
          type="range"
          min="1"
          max="3"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
        />
      </div>
      <div className="dark-mode">
        <label>Dark mode</label>
        <input
          type="checkbox"
          checked={darkMode}
          onChange={() => setDarkMode(!darkMode)}
        />
      </div>
    </div>
  );
}

export default App;
