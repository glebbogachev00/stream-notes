import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ArtGallery = ({ artNotes, onDeleteNote }) => {
  const { theme } = useTheme();

  const getArtStyleClasses = (artStyle) => {
    if (artStyle === 'stencil') {
      return {
        container: 'bg-white text-black border-4 border-black p-8 rounded-lg',
        text: 'font-black tracking-widest uppercase select-none',
        words: 'space-y-2'
      };
    }
    // Default SAMO style
    return {
      container: 'bg-black text-white p-8 rounded-lg',
      text: 'font-bold tracking-wide uppercase select-none',
      words: 'space-y-1'
    };
  };

  const renderArtContent = (note) => {
    const styles = getArtStyleClasses(note.artStyle);
    const baseFontSize = 1.5;
    const isStencil = note.artStyle === 'stencil';
    
    return (
      <div className={`${styles.container} min-h-48 shadow-xl relative overflow-hidden flex flex-col justify-center items-center text-center`}>
        <div className={`${styles.words} w-full`}>
          {isStencil ? (
            // Stencil mode - clean, centered lines
            <div className="space-y-3">
              {note.content.split('\n').filter(line => line.trim()).map((line, lineIndex) => (
                <div key={lineIndex} className="block">
                  <span className={`${styles.text} inline-block`} style={{
                    fontSize: `${baseFontSize}rem`,
                    letterSpacing: '3px',
                    fontWeight: '900'
                  }}>
                    {line.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            // SAMO mode - rough, organic but centered
            <div className="space-y-2">
              {note.content.split(' ').reduce((lines, word, index) => {
                if (index % 3 === 0) lines.push([]);
                lines[lines.length - 1].push(word);
                return lines;
              }, []).map((lineWords, lineIndex) => (
                <div key={lineIndex} className="block">
                  {lineWords.map((word, wordIndex) => (
                    <span key={wordIndex} className="inline-block mr-2">
                      {word.split('').map((letter, letterIndex) => (
                        <span
                          key={letterIndex}
                          className={`${styles.text} inline-block`}
                          style={{
                            fontSize: `${baseFontSize + (Math.random() - 0.5) * 0.4}rem`,
                            transform: `rotate(${(Math.random() - 0.5) * 8}deg) scaleY(${0.9 + Math.random() * 0.2})`,
                            letterSpacing: `${(Math.random() - 0.5) * 2}px`,
                            textShadow: '1px 1px 2px rgba(255,255,255,0.1)',
                            filter: 'drop-shadow(0 0 1px white)'
                          }}
                        >
                          {letter}
                        </span>
                      ))}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="absolute bottom-2 right-2 text-xs opacity-40 font-mono">
          {isStencil ? '[stream]©' : 'SAMO©'}
        </div>
      </div>
    );
  };

  if (artNotes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mb-8">
          <div className="bg-black text-white p-8 rounded-lg shadow-xl max-w-md mx-auto">
            <div className="space-y-1">
              {['TRANSFORM', 'YOUR', 'FAVORITE', 'NOTES', 'INTO', 'RAW', 'STREET', 'ART', 'VISUALS'].map((word, index) => (
                <div
                  key={index}
                  className="block"
                  style={{
                    transform: `rotate(${(Math.random() - 0.5) * 3}deg)`,
                    marginLeft: `${Math.random() * 15}px`,
                    marginTop: `${Math.random() * 4 - 2}px`
                  }}
                >
                  {word.split('').map((letter, letterIndex) => (
                    <span
                      key={letterIndex}
                      className="font-bold tracking-wide uppercase inline-block"
                      style={{
                        fontSize: `${1.1 + (Math.random() - 0.5) * 0.3}rem`,
                        transform: `rotate(${(Math.random() - 0.5) * 6}deg) scaleY(${0.9 + Math.random() * 0.2})`,
                        letterSpacing: `${(Math.random() - 0.5) * 2}px`,
                        textShadow: '1px 1px 2px rgba(255,255,255,0.1)'
                      }}
                    >
                      {letter}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <div className="absolute bottom-2 right-2 text-xs opacity-40 font-mono">SAMO©</div>
          </div>
        </div>
        <p className={`text-sm ${theme.textTertiary} font-light`}>
          Channel your inner Basquiat
        </p>
        <p className={`text-xs ${theme.textTertiary} font-light mt-2`}>
          Use the palette icon on any note to create art
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        {artNotes.map((note) => (
          <article
            key={note.id}
            className="group relative transition-transform hover:scale-105 duration-300"
          >
            {renderArtContent(note)}
            
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={() => onDeleteNote(note.id)}
                className={`p-1 rounded ${theme.textTertiary} hover:text-red-500 transition-colors`}
                title="Delete art piece"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
};

export default ArtGallery;