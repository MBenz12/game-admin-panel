import Header from "components/Header";
import CoinflipPage from "pages/coinflip";
import MyNftMachine from "pages/nft";
import PlinkoPage from "pages/plinko";
import Rust from "pages/rust";
import SlotsPage from "pages/slots";
import { Route, Routes } from "react-router-dom";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Header />} />
      <Route path="/rust" element={<Rust />} />
      <Route path="/nft" element={<MyNftMachine />} />
      <Route path="/slots" element={<SlotsPage />} />
      <Route path="/coinflip" element={<CoinflipPage />} />
      <Route path="/plinko" element={<PlinkoPage />} />
    </Routes>
  );
};

export default Router;
