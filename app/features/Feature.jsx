const feature = [
  {
    src: "https://img.icons8.com/wired/80/FFFFFF/chipping.png",
    alt: "AI-Powered",
    title: "AI-Powered",
    description:
      "Harness the power of AI to bring you personalized insights and recommendations",
  },
  {
    src: "https://img.icons8.com/material-outlined/80/FFFFFF/lightning-bolt--v1.png",
    alt: "Quick Results",
    title: "Quick Results",
    description:
      "Get instant answers to your questions, making exploration effortless and efficient",
  },
  {
    src: "https://img.icons8.com/parakeet-line/80/FFFFFF/add-image.png",
    alt: "Upload Image",
    title: "Upload Image",
    description:
      "Simply upload a photo to reveal the story behind every place you encounter",
  },
  {
    src: "https://img.icons8.com/pastel-glyph/80/FFFFFF/search--v2.png",
    alt: "Search",
    title: "Search",
    description:
      "Easily search for places by name or description to unlock a world of discovery",
  },

  {
    src: "https://img.icons8.com/ios/80/FFFFFF/filter--v1.png",
    alt: "Filter",
    title: "Filter",
    description:
      "Customize your search to match your interests and travel style for a truly personal experience",
  },
];

const Feature = () => {
  return (
    <>
      {feature.map((featureItem, index) => (
        <div
          key={index}
          data-aos-delay={`${index * 100}`}
          data-aos="fade"
          className="bg-gradient-to-r from-primary to-primary/80 border-b border-secondary/90 shadow-md elevated-card  p-3 rounded-2xl mb-3"
        >
          <div className="flex gap-x-3 items-center mb-1.5">
            <img
              src={featureItem.src}
              className="py-1 px-2 bg-tertiary/80 rounded-full w-9 h-9 object-contain"
              alt={featureItem.alt}
            />
            <h1 className="text-lg font-semibold text-white">
              {featureItem.title}
            </h1>
          </div>
          <p className="text-gray-200 font-light text-sm">
            {featureItem.description}
          </p>
        </div>
      ))}
    </>
  );
};

export default Feature;
