import React from 'react';
import styles from './GameCard.module.css'; // <-- Importing the module!

const GameCard = ({ title }) => {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
    </div>
  );
};

export default GameCard;