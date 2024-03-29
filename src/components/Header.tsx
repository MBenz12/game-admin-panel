export default function Header() {
  return (
    <div className="py-6 flex justify-center w-full bg-[#1D1326]">
      <ul className="flex gap-5">
        <li>
          <a className="text-white" href="/rust">Rust</a>
        </li>
        <li>
          <a className="text-white" href="/nft">Nft</a>
        </li>
        <li>
          <a className="text-white" href="/slots">Slots</a>
        </li>
        <li>
          <a className="text-white" href="/coinflip">Coinflip</a>
        </li>
        <li>
          <a className="text-white" href="/plinko">Plinko</a>
        </li>
        <li>
          <a className="text-white" href="/auction">Auction</a>
        </li>
        {/* <li>
          <a className="text-white" href="/orao">Orao</a>
        </li> */}
        <li>
          <a className="text-white" href="/gift">Gift</a>
        </li>
        <li>
          <a className="text-white" href="/lootbox">Lootbox</a>
        </li>
      </ul>
    </div>
  );
}
