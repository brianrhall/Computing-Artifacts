import React, { useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

const fmt = (s) => {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

const AudioPlayer = ({ src }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
    } else {
      el.pause();
    }
  };

  const seek = (e) => {
    const t = Number(e.target.value);
    audioRef.current.currentTime = t;
    setCurrent(t);
  };

  return (
    <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-3">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
      />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause audio' : 'Play audio'}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center"
      >
        {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
      </button>

      <span className="text-sm text-gray-600 tabular-nums w-10 text-right">{fmt(current)}</span>

      <input
        type="range"
        min="0"
        max={isFinite(duration) ? duration : 0}
        step="0.1"
        value={current}
        onChange={seek}
        aria-label="Seek"
        className="flex-1 min-w-0"
      />

      <span className="text-sm text-gray-600 tabular-nums w-10">{fmt(duration)}</span>
    </div>
  );
};

export default AudioPlayer;