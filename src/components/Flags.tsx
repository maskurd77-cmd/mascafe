import React from 'react';

export const FlagKU = () => (
  <svg className="w-5 h-5 rounded-full object-cover shrink-0" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
    <rect width="900" height="600" fill="#fff"/>
    <rect width="900" height="200" fill="#eb232b"/>
    <rect y="400" width="900" height="200" fill="#278e43"/>
    <circle cx="450" cy="300" r="100" fill="#f9a526"/>
    <circle cx="450" cy="300" r="120" fill="none" stroke="#f9a526" strokeWidth="20" strokeDasharray="10 20"/>
  </svg>
);

export const FlagAR = () => (
  <svg className="w-5 h-5 rounded-full object-cover shrink-0" viewBox="0 0 1200 600" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="600" fill="#00732f"/>
    <rect y="200" width="1200" height="200" fill="#fff"/>
    <rect y="400" width="1200" height="200" fill="#000"/>
    <rect width="300" height="600" fill="#ff0000"/>
  </svg>
);

export const FlagEN = () => (
  <svg className="w-5 h-5 rounded-full object-cover shrink-0" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
    <clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
    <clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
    <g clipPath="url(#s)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
    </g>
  </svg>
);
