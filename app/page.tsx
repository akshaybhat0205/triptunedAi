"use client";

import {
  AwaitedReactNode,
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
  useEffect,
  useRef,
  useState,
} from "react";
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
import CustomAccordian from "./accordion/Accordion";
import Feature from "./features/Feature";

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [textInput, setTextInput] = useState<string>(""); // For text input
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(null); // State to track the active item
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
      setActiveIndex(null);
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
      setActiveIndex(null);
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
    <div
      className="min-h-screen bg-primary/90 xl:bg-slate-800"
      ref={scrollToHome && scrollToHome}
    >
      <div className="grid grid-cols-12 gap-4 mx-auto xl:container xl:py-10">
        <div className="col-span-12 xl:col-span-8  rounded-2xl">
          <div className="banner xl:rounded-2xl">
            <img src="./res.jpg" alt="Banner" className="banner-image" />
            <div className="overlay"></div>
            <Header
              scrollToFeatures={scrollToFeatures}
              scrollToExplore={scrollToExplore}
              scrollToHome={scrollToHome}
            />
            <div className=" w-full text-lg text-white font-bold my-2  astoria-font tracking-wider developed-by-content px-4 xl:px-8">
              <div className="flex gap-3 items-center justify-center">
                <p>
                  Developed By{" "}
                  <span className="text-secondary">Akshay Bhat</span>
                </p>
                <a
                  href="https://github.com/akshaybhat0205"
                  target="_blank"
                  rel="noopener noreferrer"
                  className=" transition duration-150 ease-in-out"
                >
                  <img
                    src="https://img.icons8.com/ios-filled/50/FFFFFF/circled-up-right-2.png"
                    className="w-6 h-6"
                    alt="Github"
                  />
                </a>
              </div>
            </div>
            <div className="content p-4 xl:p-8">
              <h1 className="text-white font-bold astoria-font text-5xl">
                <p className="md:text-center xl:text-left text-2xl md:text-4xl text-white font-bold mb-2 md:mb-6 astoria-font tracking-wider">
                  Smart Travel, Zero Hassle
                </p>
                <p className="md:text-center xl:text-left text-2xl md:text-4xl text-white font-bold mb-2 md:mb-6 astoria-font tracking-wider">
                  Guided By Next-Gen <span className="text-secondary">AI</span>
                </p>
              </h1>
              <div>
                {/* Option Toggle */}
                <div className="mt-4 mb-6 flex justify-center xl:justify-start">
                  <button
                    className={`mr-4 py-3 md:py-2 px-4 rounded-lg text-sm md:text-base font-medium w-44 ${
                      inputType === "image"
                        ? "border-b-2 border-secondary bg-gray-800 text-white"
                        : "bg-gray-800 text-white"
                    }`}
                    onClick={() => handleInputTypeChange("image")}
                  >
                    Upload Image
                  </button>
                  <button
                    className={`py-3 md:py-2 px-4 rounded-lg text-sm md:text-base font-medium w-44  ${
                      inputType === "text"
                        ? "border-b-2 border-secondary bg-gray-800 text-white"
                        : "bg-gray-800 text-white"
                    }`}
                    onClick={() => handleInputTypeChange("text")}
                  >
                    Enter Place Name
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-2 md:gap-4 items-center md:max-w-3xl max-w-4xl xl:mx-0 md:mx-auto">
                  <div className="md:col-span-5 col-span-12">
                    {/* Image Upload */}
                    {inputType === "image" && (
                      <div className="md:mb-8">
                        <label
                          htmlFor="image-upload"
                          className="block text-sm md:text-base font-medium text-white mb-2"
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
                      <div className="mb-4 md:mb-4">
                        <label
                          htmlFor="text-input"
                          className="block text-sm md:text-base font-medium text-gray-300 mb-2"
                        >
                          Enter the name of place
                        </label>
                        <input
                          id="text-input"
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          className="w-full text-sm p-2 border bg-white rounded-lg text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Write the name of place..."
                        ></input>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-5 col-span-12">
                    {/* Category Dropdown */}
                    <div className="mb-4 md:mb-4">
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
                        className="w-full p-2.5 text-sm md:text-base text-primary border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="">No Thoughts</option>
                        <option value="Museums">Museums</option>
                        <option value="Monuments">Monuments</option>
                        <option value="Holy Places">Holy Places</option>
                        <option value="Beaches">Beaches</option>
                        <option value="Hotels">Hotels</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-2 align-self-end text-center">
                    <button
                      onClick={() => identifyImageOrText()}
                      disabled={
                        (inputType === "image" && !image) ||
                        (inputType === "text" && !textInput.trim()) ||
                        loading
                      }
                      className="w-24 text-center md:w-full  bg-tertiary  text-sm md:text-base text-white md:py-2.5 py-2  px-4 rounded-lg md:rounded-r-full hover:bg-tertiary/80 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed font-medium md:mt-4"
                    >
                      {loading ? "Searching..." : "Search"}
                    </button>
                  </div>
                </div>
              </div>
              {result && relatedQuestions.length > 0 && (
                <div className="relative mt-8 md:mt-0">
                  <div
                    className="absolute top-0 left-0 w-full md:max-h-[200px] max-h-[250px] overflow-y-auto custom-scrollbar mb-3 p-4 rounded-xl shadow-lg border-b border-secondary bg-primary"
                    style={{
                      zIndex: 10,
                    }}
                  >
                    {result &&
                      result.split("\n").length > 0 &&
                      result.split("\n").map((line, index) => (
                        <div key={index}>
                          <div className="text-gray-200 font-light ">
                            <p className="mb-2 md:text-gray-300 text-white text-base md:text-lg">
                              {line}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-span-12 xl:col-span-4 bg-transparent pt-8 xl:pt-0 rounded-2xl xl:max-h-[650px]">
          {result && relatedQuestions.length > 0 ? (
            <div data-aos="fade" data-aos-duration="400">
              <p className="text-secondary md:text-center xl:text-left text-4xl astoria-font tracking-widest font-bold mb-4 px-4">
                Nearby {category ? category : "Places"}
              </p>
              <div className="max-h-[600px] overflow-auto custom-scrollbar px-4">
                <CustomAccordian
                  data={relatedQuestions}
                  activeIndex={activeIndex}
                  setActiveIndex={setActiveIndex}
                  textInput={textInput}
                />
              </div>
            </div>
          ) : (
            <div data-aos="fade" data-aos-duration="400">
              <p className="text-secondary md:text-center xl:text-left text-4xl astoria-font tracking-widest font-bold mb-4 px-4">
                Features
              </p>
              <div className="max-h-[600px] overflow-auto custom-scrollbar px-4">
                <Feature />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
