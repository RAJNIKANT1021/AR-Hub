import React from 'react';
import './Message.css';

const Message = ({ text }) => {
  return (
    <div className="sender">
      <div className="text">{text}</div>
    </div>
  );
};

export default Message;