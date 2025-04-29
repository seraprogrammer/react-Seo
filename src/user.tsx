import { Export } from "./toHtml";

export default function user() {
  return (
    <Export filename="user">
      <ul>
        <li>user1</li>
        <li>user2</li>
        <li>user3</li>
      </ul>
    </Export>
  );
}
