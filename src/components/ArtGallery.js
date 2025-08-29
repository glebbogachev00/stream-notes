import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ArtGallery = ({ artNotes, onDeleteNote }) => {
  const { theme } = useTheme();

  const getArtStyleClasses = () => {
    return {
      container: 'bg-black text-white p-8 rounded-lg',
      text: 'font-bold tracking-wide uppercase select-none',
      words: 'space-y-1'
    };
  };

  const renderArtContent = (note) => {
    const styles = getArtStyleClasses();
    const baseFontSize = 1.5;
    
    // Split content into words and arrange them vertically like SAMO
    const words = note.content.toUpperCase().split(' ');
    
    return (
      <div className={`${styles.container} min-h-48 shadow-xl relative overflow-hidden flex flex-col justify-center items-start`}>
        <div className={styles.words}>
          {words.map((word, index) => (
            <div
              key={index}
              className="block"
              style={{
                transform: `rotate(${(Math.random() - 0.5) * 4}deg)`,
                marginLeft: `${Math.random() * 20}px`,
                marginTop: `${Math.random() * 8 - 4}px`
              }}
            >
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
            </div>
          ))}
        </div>
        
        <div className="absolute bottom-2 right-2 text-xs opacity-40 font-mono">
          ©{new Date(note.transformedAt).getFullYear()}
        </div>
      </div>
    );
  };


  if (artNotes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mb-8">
          <div className="bg-black text-white p-8 rounded-lg shadow-xl transform -rotate-1 max-w-md mx-auto">
            <div className="space-y-2">
              {['SAMO', 'FOR', 'THE', 'SO-CALLED', 'AVANT-GARDE'].map((word, index) => (
                <span
                  key={index}
                  className="font-bold text-lg inline-block mr-2 transform uppercase tracking-wide"
                  style={{
                    fontSize: `${0.8 + Math.random() * 0.6}rem`,
                    transform: `rotate(${(Math.random() - 0.5) * 8}deg)`
                  }}
                >
                  {word}
                </span>
              ))}
            </div>
            <div className="absolute bottom-2 right-2 text-xs opacity-60">©1978</div>
          </div>
        </div>
        <p className={`text-sm ${theme.textTertiary} font-light`}>
          Transform your notes into beautiful art pieces
        </p>
        <p className={`text-xs ${theme.textTertiary} font-light mt-2`}>
          Use the palette icon on any note to create art
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artNotes.map((note) => (
          <article
            key={note.id}
            className="group relative transition-transform hover:scale-105 duration-300"
          >
            {renderArtContent(note)}
            
            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNote(note.id);
                }}
                className={`px-2 py-1 text-xs ${theme.bg} ${theme.text} rounded shadow hover:opacity-80 transition-opacity`}
              >
                delete
              </button>
            </div>
          </article>
        ))}
      </div>

    </>
  );
};

export default ArtGallery;