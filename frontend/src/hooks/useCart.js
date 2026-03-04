import { useContext } from 'react';
import { CartContext } from '../contexts/cartContextDef';

const useCart = () => {
  return useContext(CartContext);
};

export default useCart;
