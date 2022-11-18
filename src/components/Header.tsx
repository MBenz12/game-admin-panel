export default function Header() {
  return (
    <div className="py-6 flex justify-center w-full bg-[#1D1326]">
      <ul className="flex gap-5">
        <li>
          <a className="text-white" href="/rust">rust</a>
        </li>
        <li>
          <a className="text-white" href="/nft">nft</a>
        </li>
        <li>
          <a className="text-white" href="/slots">slots</a>
        </li>
        <li>
          <a className="text-white" href="/coinflip">coinflip</a>
        </li>
      </ul>
    </div>
  );
}
