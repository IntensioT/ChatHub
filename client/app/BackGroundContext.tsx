import React, { createContext, useState } from 'react';

const imagePaths = ['/backgrounds/1.jpg', '/backgrounds/2.jpg',
    '/backgrounds/3.jpg', '/backgrounds/4.jpg', '/backgrounds/5.jpg'
];

interface BackgroundContextData {
  background: string;
//   changeBackground: (newBackground: string) => void;
  changeBackgroundNumber: (imageNumber: number) => void;
  updateBackground: (newBackground: string) => void;
}

const BackgroundContext = createContext<BackgroundContextData>({
  background: '',
//   changeBackground: () => {},
  changeBackgroundNumber: () => {},
  updateBackground: () => {},
});

const bg2 = "/backgrounds/2.jpg"

// Указываем тип для пропсов
export const BackgroundProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [background, setBackground] = useState(bg2);

//   const changeBackground = (newBackground: string) => {
//     setBackground(newBackground);
//   };

  const changeBackgroundNumber = (imageNumber: number) => {
    const newBackground = imagePaths[imageNumber - 1];
    setBackground(newBackground);
  };

  const updateBackground = (newBackground: string) => {
    setBackground(newBackground);
    localStorage.setItem('selectedBg', newBackground);
  };

  return (
    <BackgroundContext.Provider value={{ background, changeBackgroundNumber, updateBackground }}>
      {children}
    </BackgroundContext.Provider>
  );
};

export default BackgroundContext;
