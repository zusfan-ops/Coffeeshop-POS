import React from 'react';
import { 
  Coffee, 
  CupSoda, 
  GlassWater, 
  Leaf, 
  Cookie, 
  Cake, 
  Wine, 
  Flame, 
  Sparkles,
  ShoppingBag,
  LucideProps
} from 'lucide-react';

interface ProductIconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

export const ProductIcon: React.FC<ProductIconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'Coffee':
      return <Coffee {...props} />;
    case 'CupSoda':
      return <CupSoda {...props} />;
    case 'GlassWater':
      return <GlassWater {...props} />;
    case 'Leaf':
      return <Leaf {...props} />;
    case 'Cookie':
      return <Cookie {...props} />;
    case 'Cake':
      return <Cake {...props} />;
    case 'Wine':
      return <Wine {...props} />;
    case 'Flame':
      return <Flame {...props} />;
    case 'Sparkles':
      return <Sparkles {...props} />;
    default:
      return <ShoppingBag {...props} />;
  }
};
