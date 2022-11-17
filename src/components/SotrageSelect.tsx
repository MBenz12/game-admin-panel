import { useEffect, useState } from "react";

export default function StorageSelect({
  itemkey,
  defaultItems,
  defaultItem,
  label,
  setItem,
}: {
  itemkey: string;
  defaultItems: string[];
  defaultItem: string;
  label: string;
  setItem: (item: string) => any;
}) {
  const [items, setItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [editItem, setEditItem] = useState<string>("");

  useEffect(() => {
    // localStorage.removeItem(itemkey);
    // localStorage.removeItem(`${itemkey}s`);

    const selectedItem = localStorage.getItem(itemkey);
    const items = localStorage.getItem(`${itemkey}s`);
    if (selectedItem) {
      setSelectedItem(selectedItem);
    } else {
      setSelectedItem(defaultItem);
      localStorage.setItem(itemkey, defaultItem);
    }
    if (items) {
      setItems(JSON.parse(items));
    } else {
      setItems(defaultItems);
      localStorage.setItem(`${itemkey}s`, JSON.stringify(defaultItems));
    }
  }, [itemkey]);
  return (
    <div className="flex gap-2 items-center">
      <p>{label}:</p>
      <select
        className="border-2 border-black p-2"
        onChange={(e) => {
          setSelectedItem(e.target.value);
          localStorage.setItem(itemkey, e.target.value);
          setItem(e.target.value);
        }}
        value={selectedItem}
      >
        {items.map((item, index) => (
          <option value={item} key={item + index}>
            {item}
          </option>
        ))}
      </select>
      <div className="flex gap-2 items-center">
        New: <input className="border-2 border-black p-2" onChange={(e) => setEditItem(e.target.value)} value={editItem} />
        <button
          className="border-2 border-black p-2"
          onClick={() => {
            const newItems = [...items];
            newItems.push(editItem);
            setItems(newItems);
            localStorage.setItem(`${itemkey}s`, JSON.stringify(newItems));
            setSelectedItem(editItem);
            localStorage.setItem(itemkey, editItem);
            setItem(editItem);
          }}
        >
          Add
        </button>
        <button
          className="border-2 border-black p-2"
          onClick={() => {
            const newItems = items.filter((item) => item !== selectedItem);
            setItems(newItems);
            localStorage.setItem(`${itemkey}s`, JSON.stringify(newItems));
            setSelectedItem("");
            localStorage.setItem(itemkey, "");
            setItem("");
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
