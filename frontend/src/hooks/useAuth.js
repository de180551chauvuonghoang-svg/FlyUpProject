import { useContext } from 'react';
import { AuthContext } from '../contexts/authContextDef';

const useAuth = () => {
  return useContext(AuthContext);
};

export default useAuth;
