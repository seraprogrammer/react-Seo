import { Export } from "../toHtml";
import { Metadata, SEO } from "../meta";

export default function Home() {
  const metadata: Metadata = {
    title: "Home page",
    description: "Home page of our powerful SEO React app",
    keywords: "react, seo, typescript, home",
  };

  return (
    <Export filename="home">
      <SEO metadata={metadata} />
      <div>Home</div>
    </Export>
  );
}
