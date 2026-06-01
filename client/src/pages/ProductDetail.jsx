import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, ShieldAlert, ShoppingBag } from "lucide-react";
import { storeProducts } from "../data/storeProducts";

function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const product = storeProducts.find((item) => item.id === id);

  if (!product) {
    return (
      <div className="elite-empty-card">
        <h2>Product Not Found</h2>
        <button onClick={() => navigate("/store")}>Back to Store</button>
      </div>
    );
  }

  const buyProduct = () => {
    window.open(product.affiliateLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="product-detail-page">
      <button className="elite-back-btn" onClick={() => navigate("/store")}>
        <ArrowLeft size={18} />
        Back to Store
      </button>

      <div className="product-detail-image">
        <img src={product.image} alt={product.name} />
      </div>

      <div className="product-detail-card">
        <p>{product.category}</p>
        <h1>{product.name}</h1>
        <h2>{product.price}</h2>

        <span>{product.description}</span>

        <div className="product-benefits">
          <h3>Benefits</h3>

          {product.benefits.map((benefit) => (
            <div key={benefit}>
              <ShoppingBag size={17} />
              <p>{benefit}</p>
            </div>
          ))}
        </div>

        <div className="product-usage-card">
          <h3>Suggested Usage</h3>
          <p>{product.usage}</p>
        </div>

        <div className="product-warning">
          <ShieldAlert size={22} />
          <p>
            Supplements are not medical advice. If you have any health condition
            or take medication, consult a doctor before using.
          </p>
        </div>

        <button className="buy-product-btn" onClick={buyProduct}>
          Buy on Amazon
          <ExternalLink size={19} />
        </button>
      </div>
    </div>
  );
}

export default ProductDetail;