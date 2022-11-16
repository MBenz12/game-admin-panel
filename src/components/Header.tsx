export default function Header() {
  return (
    <div className="py-5 flex justify-center">
      <ul className="flex gap-5">
        <li>
          <a href="/rust">rust</a>
        </li>
        <li>
          <a href="/nft">nft</a>
        </li>
        <li>
          <a href="/slots">slots</a>
        </li>
        <li>
          <a href="/coinflip">coinflip</a>
        </li>
      </ul>
    </div>
  );
}
