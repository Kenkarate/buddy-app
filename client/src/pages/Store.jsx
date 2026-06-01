import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { storeProducts } from "../data/storeProducts";

function Store() {
  const navigate = useNavigate();

  return (
    <div className="store-page">
      <div className="store-header">
        <p>Buddy Store</p>
        <h1>Fitness Picks</h1>
        <span>Supplements and gym essentials recommended for active users.</span>
      </div>

      <div className="store-grid">
        {storeProducts.map((product) => (
          <button
            className="store-product-card"
            key={product.id}
            onClick={() => navigate(`/product/${product.id}`)}
          >
            <div className="store-product-image">
              <img src={product.image} alt={product.name} />
            </div>

            <div className="store-product-info">
              <p>{product.category}</p>
              <h2>{product.name}</h2>

              <div>
                <strong>{product.price}</strong>
                <ShoppingBag size={18} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Store;