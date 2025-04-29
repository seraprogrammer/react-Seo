// meta.tsx
import { useEffect } from "react";

export interface Metadata {
  // Basic SEO
  title?: string;
  description?: string;
  keywords?: string;

  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;

  // Twitter Card
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterSite?: string;
  twitterCreator?: string;

  // Additional SEO
  canonicalUrl?: string;
  robots?: string;
  language?: string;
  author?: string;

  // Structured data (JSON-LD)
  structuredData?: object;

  // Allow any other meta tags
  [key: string]: string | number | boolean | object | undefined;
}

export const applyMetadata = (metadata: Metadata) => {
  // Update document title
  if (metadata.title) {
    document.title = metadata.title;
  }

  // Clear previous JSON-LD data
  const existingScripts = document.querySelectorAll(
    'script[type="application/ld+json"]'
  );
  existingScripts.forEach((script) => script.remove());

  // Add JSON-LD structured data if provided
  if (metadata.structuredData) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(metadata.structuredData);
    document.head.appendChild(script);
  }

  // Add canonical URL
  if (metadata.canonicalUrl) {
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement("link");
      canonicalTag.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute("href", metadata.canonicalUrl);
  }

  // Process all metadata properties
  Object.entries(metadata).forEach(([key, value]) => {
    if (
      !value ||
      key === "title" ||
      key === "structuredData" ||
      key === "canonicalUrl"
    )
      return;

    let property: string;
    let attributeName: string;

    // Determine attribute name and property based on key prefix
    if (key.startsWith("og")) {
      attributeName = "property";
      property = `og:${key.substring(2).toLowerCase()}`;
    } else if (key.startsWith("twitter")) {
      attributeName = "name";
      property = `twitter:${key.substring(7).toLowerCase()}`;
    } else {
      attributeName = "name";
      property = key;
    }

    // Find or create meta tag
    let tag = document.querySelector(`meta[${attributeName}="${property}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(attributeName, property);
      document.head.appendChild(tag);
    }

    // Set content
    tag.setAttribute("content", String(value));
  });

  // Set language attribute on html tag
  if (metadata.language) {
    document.documentElement.setAttribute("lang", metadata.language);
  }
};

export const SEO = ({ metadata }: { metadata: Metadata }) => {
  useEffect(() => {
    applyMetadata(metadata);

    // Clean up function to reset meta tags when component unmounts
    return () => {
      // You could implement a reset function here if needed
    };
  }, [metadata]);

  return null;
};

// Usage example for a page
export const createStructuredData = {
  // Article
  article: (data: {
    headline: string;
    image: string;
    datePublished: string;
    dateModified?: string;
    author: string;
    publisher: string;
    publisherLogo: string;
    description: string;
  }) => ({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.headline,
    image: data.image,
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    author: {
      "@type": "Person",
      name: data.author,
    },
    publisher: {
      "@type": "Organization",
      name: data.publisher,
      logo: {
        "@type": "ImageObject",
        url: data.publisherLogo,
      },
    },
    description: data.description,
  }),

  // Local Business
  localBusiness: (data: {
    name: string;
    image: string;
    telephone: string;
    address: string;
    priceRange: string;
    description: string;
  }) => ({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: data.name,
    image: data.image,
    telephone: data.telephone,
    address: {
      "@type": "PostalAddress",
      streetAddress: data.address,
    },
    priceRange: data.priceRange,
    description: data.description,
  }),

  // Product
  product: (data: {
    name: string;
    image: string;
    description: string;
    brand: string;
    price: string;
    currency: string;
    availability: string;
  }) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.name,
    image: data.image,
    description: data.description,
    brand: {
      "@type": "Brand",
      name: data.brand,
    },
    offers: {
      "@type": "Offer",
      price: data.price,
      priceCurrency: data.currency,
      availability: `https://schema.org/${data.availability}`,
    },
  }),
};
