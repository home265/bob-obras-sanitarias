"use client";

import { useState, useEffect } from "react";

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  onChange: (value: number) => void;
}

export default function SimpleNumberInput({ value, onChange, ...props }: Props) {
  const [displayValue, setDisplayValue] = useState(String(value));

  useEffect(() => {
    // Sincroniza el input si el valor externo cambia (ej: al cargar datos)
    if (Number(displayValue) !== value) {
      setDisplayValue(String(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Permite que el campo esté vacío o sea un número válido
    if (inputValue === '' || /^-?\d*\.?\d*$/.test(inputValue)) {
      setDisplayValue(inputValue);
      if (inputValue !== '' && !isNaN(Number(inputValue))) {
        onChange(Number(inputValue));
      } else if (inputValue === '') {
        // Si se borra todo, enviamos 0 como valor numérico
        onChange(0);
      }
    }
  };
  
  const handleBlur = () => {
    // Al salir del input, si está vacío o inválido, lo formateamos al último valor numérico válido.
    if (displayValue === '' || isNaN(Number(displayValue))) {
      setDisplayValue(String(value));
    }
  };

  return (
    <input
      {...props}
      type="number"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}