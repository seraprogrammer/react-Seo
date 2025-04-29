import { Metadata, SEO } from "../meta";
import { Export } from "../toHtml";

export default function About() {
  const pageMetadata: Metadata = {
    title: "About page",
    description: "About page of our powerful SEO React app",
    keywords: "react, seo, typescript, about",
  };

  const AboutMe = {
    name: "John Doe",
    image: "https://via.placeholder.com/150",
    description: "I am a software engineer",
    email: "john.doe@example.com",
    phone: "+1234567890",
    address: "123 Main St, Anytown, USA",
  };

  return (
    <Export filename="about">
      <SEO metadata={pageMetadata} />
      <div>
        <h1>{AboutMe.name}</h1>
        <img src={AboutMe.image} alt={AboutMe.name} />
        <p>{AboutMe.description}</p>
        <p>{AboutMe.email}</p>
        <p>{AboutMe.phone}</p>
        <p>{AboutMe.address}</p>
      </div>
    </Export>
  );
}
