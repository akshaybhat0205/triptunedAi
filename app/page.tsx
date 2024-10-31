"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Banner from "./banner/Banner";
import AOS from "aos"; // Import AOS
import "aos/dist/aos.css"; // Import AOS CSS
import HomeBanner from "./banner/HomeBanner";
import "./banner/HomeBanner.css";
import Header from "./banner/Header";
import ScrollToTop from "react-scroll-to-top";
import { IoIosArrowDropupCircle } from "react-icons/io";

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [textInput, setTextInput] = useState<string>(""); // For text input
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [relatedQuestions, setRelatedQuestions] = useState<
    { name: string; link: string; info: string }[]
  >([]);
  const [inputType, setInputType] = useState<"image" | "text">("image"); // Toggle between image and text input
  const [category, setCategory] = useState<string>(""); // State for selected category

  useEffect(() => {
    AOS.init({
      offset: 100,
      duration: 800,
      easing: "ease-in-sine",
      delay: 100,
    });
    AOS.refresh();
  }, []);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const identifyImageOrText = async (additionalPrompt: string = "") => {
    setLoading(true);

    if (inputType === "image" && image) {
      await identifyImage(additionalPrompt);
    } else if (inputType === "text" && textInput.trim()) {
      await identifyText(textInput, additionalPrompt);
    }

    setLoading(false);
  };

  const identifyImage = async (additionalPrompt: string = "") => {
    if (!image) return;

    const genAI = new GoogleGenerativeAI(
      process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY!
    );
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
      const imageParts = await fileToGenerativePart(image);
      const result = await model.generateContent([
        `Identify the place in the image and provide information ${additionalPrompt}`,
        imageParts,
      ]);
      const response = await result.response;
      const text = formatResponseText(response);
      setResult(text);
      generateKeywords(text);
      await generateRelatedQuestions("image", text);
      (scrollToResult as any)?.current.scrollIntoView({
        behavior: "smooth",
      });
    } catch (error) {
      handleError(error);
    }
  };

  const identifyText = async (
    textInput: string,
    additionalPrompt: string = ""
  ) => {
    const genAI = new GoogleGenerativeAI(
      process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY!
    );
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
      const result = await model.generateContent([
        `Identify the place based on the following description and provide a paragraph of information ${additionalPrompt}: ${textInput}`,
      ]);
      const response = await result.response;
      const text = formatResponseText(response);
      setResult(text);
      generateKeywords(text);
      await generateRelatedQuestions("input", text);
      (scrollToResult as any)?.current.scrollIntoView({
        behavior: "smooth",
      });
    } catch (error) {
      handleError(error);
    }
  };

  const formatResponseText = (response: any): string => {
    return response
      .text()
      .trim()
      .replace(/```/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/-\s*/g, "")
      .replace(/\n\s*\n/g, "\n");
  };

  const handleError = (error: any) => {
    console.error("Error identifying:", error);
    if (error instanceof Error) {
      setResult(`Error: ${error.message}`);
    } else {
      setResult("An unknown error occurred.");
    }
  };

  const generateKeywords = (text: string) => {
    const words = text.split(/\s+/);
    const keywordSet = new Set<string>();
    words.forEach((word) => {
      if (
        word.length > 4 &&
        !["this", "that", "with", "from", "have"].includes(word.toLowerCase())
      ) {
        keywordSet.add(word);
      }
    });
    setKeywords(Array.from(keywordSet).slice(0, 5));
  };

  const regenerateContent = (keyword: string) => {
    identifyImageOrText(`Focus more on aspects related to "${keyword}".`);
  };

  const generateRelatedQuestions = async (type: string, text: string) => {
    const genAI = new GoogleGenerativeAI(
      process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY!
    );
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
      const result = await model.generateContent([
        `identify the place or any minimum 4 max 8 famous nearby ${
          category ? category : "tourist spots"
        } which are in range of 10-25km and add a paragraph about the information:
        ${type === "image" ? text : textInput}
        output only name and info of ${
          category ? category : "tourist spots"
        } as a simple list.`,
      ]);
      const response = await result.response;
      const places = response.text().trim().split("\n");

      const questionsWithLinks = places
        .slice(1)
        .map((place) => place.trim())
        .filter((place) => place !== "")
        .map((place) => {
          const cleanedPlace = place.replace(/\*|\*\*/g, "");
          const [name, info] = cleanedPlace
            .split(":")
            .map((part) => part.trim());
          return {
            name: name || cleanedPlace,
            info: info || "",
            link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              name || cleanedPlace
            )}`,
          };
        });

      setRelatedQuestions(questionsWithLinks);
    } catch (error) {
      setRelatedQuestions([]);
    }
  };

  async function fileToGenerativePart(file: File): Promise<{
    inlineData: { data: string; mimeType: string };
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const base64Content = base64data.split(",")[1];
        resolve({
          inlineData: {
            data: base64Content,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const handleInputTypeChange = (type: "image" | "text") => {
    // Reset results and related information when input type changes
    setInputType(type);
    setImage(null);
    setTextInput("");
    setResult(null);
    setKeywords([]);
    setRelatedQuestions([]);
  };
  console.log("relatedQuestions", relatedQuestions);

  const scrollToHome = useRef<HTMLDivElement>(null);
  const scrollToExplore = useRef<HTMLDivElement>(null);
  const scrollToFeatures = useRef<HTMLDivElement>(null);
  const scrollToResult = useRef<HTMLDivElement>(null);

  const scrollButtonStyle = {
    borderRadius: "25px",
    background: "#ffffff",
    color: "#6456DF",
    width: "32px",
    height: "32px",
  };
  return (
    <div className="min-h-screen bg-primary" ref={scrollToHome && scrollToHome}>
      <div className="banner">
        <img src="./res.jpg" alt="Banner" className="banner-image" />
        <div className="overlay"></div>
        <Header
          scrollToFeatures={scrollToFeatures}
          scrollToExplore={scrollToExplore}
          scrollToHome={scrollToHome}
        />
        <div className="content">
          <h1 className="text-white font-bold astoria-font text-5xl">
            <p className="text-2xl md:text-6xl text-white font-bold mb-6 astoria-font tracking-wider">
              Smart Travel, Zero Hassle
            </p>
            <p className="text-2xl md:text-6xl text-white font-bold mb-8 astoria-font tracking-wider">
              Guided By Next-Gen <span className="text-secondary">AI</span>
            </p>
            <p className="text-xl md:text-2xl font-bold mb-4 astoria-font tracking-wider">
              Let us guide you to effortless exploration and joy
            </p>
          </h1>
          <p>
            <button
              className="bg-transparent text-white py-2 px-4  font-medium border border-gray-300 transition duration-150 ease-in-out"
              onClick={() =>
                (scrollToExplore as any).current.scrollIntoView({
                  behavior: "smooth",
                })
              }
            >
              Explore Destination
            </button>
          </p>
        </div>
      </div>

      <div ref={scrollToFeatures && scrollToFeatures}>
        <Banner />
      </div>
      <main className="" ref={scrollToExplore && scrollToExplore}>
        <div className="bg-gradient-to-br  md:bg-gradient-to-r from-primary to-slate-800 rounded-lg">
          <div className="p-4 md:p-8 ">
            <h2 className="text-3xl font-extrabold text-white mb-12 text-center astoria-font">
              Search using Your Image or Enter Name of the place
            </h2>

            {/* Option Toggle */}
            <div className="mb-6 flex justify-center">
              <button
                className={`mr-4 py-2 px-4 rounded-lg font-medium w-44 ${
                  inputType === "image"
                    ? "border-b-2 border-secondary bg-gray-800 text-white"
                    : "bg-gray-800 text-white"
                }`}
                onClick={() => handleInputTypeChange("image")}
              >
                Upload Image
              </button>
              <button
                className={`py-2 px-4 rounded-lg font-medium w-44  ${
                  inputType === "text"
                    ? "border-b-2 border-secondary bg-gray-800 text-white"
                    : "bg-gray-800 text-white"
                }`}
                onClick={() => handleInputTypeChange("text")}
              >
                Enter Place Name
              </button>
            </div>
            <div className="grid grid-cols-12 gap-4 items-center max-w-4xl mx-auto">
              <div className="md:col-span-5 col-span-12">
                {/* Image Upload */}
                {inputType === "image" && (
                  <div className="mb-8">
                    <label
                      htmlFor="image-upload"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Upload an image
                    </label>
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-tertiary hover:file:bg-blue-100 transition duration-150 ease-in-out"
                    />
                  </div>
                )}

                {/* Text Input */}
                {inputType === "text" && (
                  <div className="mb-8">
                    <label
                      htmlFor="text-input"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Enter the name of place
                    </label>
                    <input
                      id="text-input"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="w-full p-2 border bg-white rounded-lg text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Write the name of place..."
                    ></input>
                  </div>
                )}
              </div>
              <div className="md:col-span-5 col-span-12">
                {/* Category Dropdown */}
                <div className="mb-8">
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Select a Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">No Thoughts</option>
                    <option value="Museums">Museums</option>
                    <option value="Monuments">Monuments</option>
                    <option value="Holy Places">Holy Places</option>
                    <option value="Wildlife">Wildlife</option>
                    <option value="Beaches">Beaches</option>
                    <option value="Hotels">Hotels</option>
                  </select>
                </div>
              </div>
              <div className="col-span-12 md:col-span-2 align-self-end ">
                <button
                  onClick={() => identifyImageOrText()}
                  disabled={
                    (inputType === "image" && !image) ||
                    (inputType === "text" && !textInput.trim()) ||
                    loading
                  }
                  className="w-full bg-tertiary text-white py-2.5 px-4 rounded-lg md:rounded-r-full hover:bg-tertiary/80 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                >
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </div>
          </div>

          {result && (
            <div
              className="bg-gradient-to-br  md:bg-gradient-to-r from-primary to-slate-800 p-4 md:p-8"
              ref={scrollToResult}
            >
              <h3 className="text-3xl font-semibold text-secondary mb-4 astoria-font">
                Your Destination Information
              </h3>
              <div className="prose prose-blue max-w-none mb-12">
                {result.split("\n").map((line, index) => (
                  <p key={index} className="mb-2 text-gray-300 text-lg">
                    {line}
                  </p>
                ))}
              </div>
              <div className="mb-12">
                <h4 className="text-3xl font-semibold text-secondary mb-4 astoria-font">
                  Related Keywords
                </h4>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <button
                      key={index}
                      onClick={() => regenerateContent(keyword)}
                      className=" bg-slate-800 text-secondary w-32 text-center px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 transition duration-150 ease-in-out"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
              {relatedQuestions.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-3xl font-semibold text-secondary mb-4 astoria-font">
                    Famous Nearby {category ? category : "Places"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {relatedQuestions.map((place, index) => (
                      <div
                        key={index}
                        className="bg-transparent p-4 rounded-lg border-secondary/40 border"
                        data-aos="fade-up"
                        data-aos-delay={`${index * 100}`}
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-12 justify-self-center">
                            <a
                              href={place.link + "," + textInput}
                              target="_blank"
                              rel="noopener noreferrer"
                              className=" transition duration-150 ease-in-out"
                            >
                              <img
                                className="w-12 h-12 bg-tertiary rounded-full p-2"
                                src="https://img.icons8.com/dotty/80/ffffff/place-marker.png"
                                alt="place-marker"
                              />
                            </a>
                          </div>
                          <div className="col-span-12 md:text-left text-justify">
                            <p className="font-bold text-md mb-3 text-xl text-secondary tracking-wider text-center">
                              {place.name}
                            </p>
                            <p className="text-gray-300">{place.info}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <ScrollToTop
        smooth
        width="12"
        height="12"
        style={scrollButtonStyle}
        component={<IoIosArrowDropupCircle className="w-8 h-8" />}
        className="flex justify-center place-items-center bg-secondary"
      ></ScrollToTop>
    </div>
  );
}
