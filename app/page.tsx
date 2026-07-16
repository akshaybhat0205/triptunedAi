"use client";

import { useEffect, useRef, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "./banner/HomeBanner.css";
import "./styles/glass.css";
import Header from "./banner/Header";
import CustomAccordian from "./accordion/Accordion";
import Feature from "./features/Feature";

export default function Home() {
  const [textInput, setTextInput] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(null); // State to track the active item
  const [relatedQuestions, setRelatedQuestions] = useState<
    { name: string; link: string; info: string }[]
  >([]);
  const [category, setCategory] = useState<string>("");
  const [searchMode, setSearchMode] = useState<"name" | "gps">("name");
  const [locationStatus, setLocationStatus] = useState<string>("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryOptions = [
    "No Thoughts",
    "Museums",
    "Monuments",
    "Holy Places",
    "Beaches",
    "Hotels",
    "Restaurants",
    "Cafes",
    "Cinemas",
    "Party Clubs",
  ];
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    AOS.init({
      offset: 100,
      duration: 800,
      easing: "ease-in-sine",
      delay: 100,
    });
    AOS.refresh();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const identifyImageOrText = async (additionalPrompt: string = "") => {
    setLoading(true);

    if (searchMode === "gps") {
      await fetchCurrentLocation(additionalPrompt);
    } else if (textInput.trim()) {
      await identifyText(textInput, additionalPrompt);
    }

    setLoading(false);
  };

  const fetchCurrentLocation = async (additionalPrompt: string = "") => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by this browser.");
      setResult("Geolocation is not supported by this browser.");
      return;
    }
    setLocationStatus("Getting your current location...");

    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const infoFormData = new FormData();
            infoFormData.append(
              "text",
              `GPS coordinates: latitude=${latitude}, longitude=${longitude}. Provide both a short paragraph describing the current location and a separate nearby places section with 6 to 8 items in this exact format:\nName: Short description\nDo not use bullets, numbering, or bold text. Use plain text only. Category: ${category || "tourist spots"}.`,
            );
            infoFormData.append("additionalPrompt", additionalPrompt);
            infoFormData.append("mode", "gps");

            const infoResponse = await fetch("/api/identify-image", {
              method: "POST",
              body: infoFormData,
            });

            let infoData: any = {};
            try {
              infoData = await infoResponse.json();
            } catch {
              infoData = {};
            }

            if (!infoResponse.ok) {
              throw new Error(
                infoData.error || "Unable to identify the current location.",
              );
            }

            const responseText = formatResponseText(
              (infoData.result ||
                infoData.relatedQuestions?.join("\n") ||
                "") as string,
            );
            if (!responseText) {
              throw new Error("No location information was returned.");
            }

            const { summary, places } = parseGpsResponse(responseText);
            setResult(summary);
            generateKeywords(summary);
            setRelatedQuestions(places);
            setActiveIndex(null);
            setLocationStatus(
              `Using your current location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            );
            resolve();
          } catch (error) {
            handleError(error);
            setLocationStatus(
              "Unable to fetch nearby places from your current location.",
            );
            resolve();
          }
        },
        (error) => {
          const message =
            error instanceof GeolocationPositionError
              ? error.message
              : "Location access failed.";
          setLocationStatus(`Location access failed: ${message}`);
          setResult(`Location access failed: ${message}`);
          resolve();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  };

  const identifyText = async (
    textInputValue: string,
    additionalPrompt: string = "",
  ) => {
    try {
      const formData = new FormData();
      formData.append(
        "text",
        `Place name: ${textInputValue}. Provide both a short paragraph describing the place and a separate nearby places section with 6 to 8 items in this exact format:\nName: Short description\nDo not use bullets, numbering, or bold text. Use plain text only. Category: ${category || "tourist spots"}.`,
      );
      formData.append("additionalPrompt", additionalPrompt);
      formData.append("mode", "name");

      const response = await fetch("/api/identify-image", {
        method: "POST",
        body: formData,
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to identify the place.");
      }

      const responseText = formatResponseText(
        (data.result || data.relatedQuestions?.join("\n") || "") as string,
      );
      if (!responseText) {
        throw new Error("No place information was returned.");
      }

      const { summary, places } = parseGpsResponse(responseText);
      setResult(summary);
      generateKeywords(summary);
      setRelatedQuestions(places);
      setActiveIndex(null);
    } catch (error) {
      handleError(error);
    }
  };

  const formatResponseText = (text: string): string => {
    return text
      .trim()
      .replace(/```/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/-\s*/g, "")
      .replace(/\n\s*\n/g, "\n");
  };

  const handleError = (error: unknown) => {
    console.error("Error identifying:", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";

    if (
      message.toLowerCase().includes("quota") ||
      message.toLowerCase().includes("resource_exhausted") ||
      message.toLowerCase().includes("429")
    ) {
      setResult(
        "Gemini API quota exceeded. Please wait a few minutes and try again.",
      );
    } else {
      setResult(`Error: ${message}`);
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

  const parseGpsResponse = (responseText: string) => {
    const lines = responseText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const summaryLines: string[] = [];
    const places: { name: string; link: string; info: string }[] = [];

    lines.forEach((line) => {
      if (
        line.toLowerCase().startsWith("nearby") ||
        line.toLowerCase().startsWith("places")
      ) {
        return;
      }

      const separatorIndex = line.indexOf(":");
      if (separatorIndex >= 0 && !line.toLowerCase().includes("summary")) {
        const name = line.slice(0, separatorIndex).trim();
        const info = line.slice(separatorIndex + 1).trim();
        if (name && info) {
          places.push({
            name,
            info,
            link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
          });
        }
      } else {
        summaryLines.push(line);
      }
    });

    return {
      summary: summaryLines.join("\n"),
      places,
    };
  };

  const generateRelatedQuestions = async (type: string, text: string) => {
    try {
      const formData = new FormData();
      formData.append("mode", "related");
      formData.append("category", category || "tourist spots");
      formData.append("text", type === "image" ? text : textInput);

      const response = await fetch("/api/identify-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to fetch nearby places.");
      }

      const places = Array.isArray(data.relatedQuestions)
        ? data.relatedQuestions
        : [];

      const questionsWithLinks = places
        .map((place: string) => place.trim())
        .filter((place: string) => place !== "")
        .map((place: string) => {
          const cleanedPlace = place.replace(/^\d+\.\s*/, "").trim();
          const separatorIndex = cleanedPlace.indexOf(":");
          const name =
            separatorIndex >= 0
              ? cleanedPlace.slice(0, separatorIndex).trim()
              : cleanedPlace;
          const info =
            separatorIndex >= 0
              ? cleanedPlace.slice(separatorIndex + 1).trim()
              : "";

          return {
            name: name || cleanedPlace,
            info,
            link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              name || cleanedPlace,
            )}`,
          };
        });

      setRelatedQuestions(questionsWithLinks);
    } catch {
      setRelatedQuestions([]);
    }
  };

  const resetSearch = () => {
    setTextInput("");
    setResult(null);
    setKeywords([]);
    setRelatedQuestions([]);
    setLocationStatus("");
    setCategory("");
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
  const isGpsAvailable =
    typeof navigator !== "undefined" && !!navigator.geolocation;
  return (
    <div className="min-h-screen" ref={scrollToHome && scrollToHome}>
      <div className="grid grid-cols-12 gap-4 mx-auto xl:container xl:py-10">
        <div className="col-span-12 xl:col-span-8  rounded-2xl">
          <div className="banner xl:rounded-2xl">
            <Header
              scrollToFeatures={scrollToFeatures}
              scrollToExplore={scrollToExplore}
              scrollToHome={scrollToHome}
            />
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
                <div className="mt-4 mb-6 flex justify-center xl:justify-start">
                  <button
                    className={`mr-4 glass-btn glass-toggle ${
                      searchMode === "name" ? "active-name" : ""
                    }`}
                    onClick={() => {
                      setSearchMode("name");
                      resetSearch();
                    }}
                  >
                    Search by Name
                  </button>
                  <button
                    className={`glass-btn glass-toggle ${
                      searchMode === "gps" ? "active-gps" : ""
                    }`}
                    onClick={() => {
                      setSearchMode("gps");
                      resetSearch();
                    }}
                  >
                    Use GPS Location
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-2 md:gap-4 items-center md:max-w-3xl max-w-4xl xl:mx-0 md:mx-auto">
                  <div className="md:col-span-5 col-span-12">
                    <div className="mb-4 md:mb-4">
                      <label
                        htmlFor="text-input"
                        className="block text-sm md:text-base font-medium text-gray-300 mb-2"
                      >
                        {searchMode === "name"
                          ? "Enter the name of place"
                          : "Current location search"}
                      </label>
                      {searchMode === "name" ? (
                        <input
                          id="text-input"
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          className="glass-input"
                          placeholder="Write the name of place..."
                        />
                      ) : (
                        <div className="glass-input">
                          Use current GPS location
                        </div>
                      )}
                    </div>
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
                      <div className="relative" ref={categoryRef}>
                        <button
                          type="button"
                          onClick={() => setIsCategoryOpen((prev) => !prev)}
                          className="glass-select flex items-center justify-between"
                        >
                          <span>{category || "No Thoughts"}</span>
                          <span className="ml-2">▾</span>
                        </button>
                        {isCategoryOpen && (
                          <div className="absolute z-20 mt-2 w-full max-h-56 overflow-y-auto custom-scrollbar rounded-xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
                            {categoryOptions.map((optionValue) => {
                              const value =
                                optionValue === "No Thoughts"
                                  ? ""
                                  : optionValue;
                              const selected = value === category;
                              return (
                                <button
                                  key={optionValue}
                                  type="button"
                                  onClick={() => {
                                    setCategory(value);
                                    setIsCategoryOpen(false);
                                  }}
                                  className={`w-full px-4 py-3 text-left text-sm text-white transition hover:bg-slate-900/70 flex items-center justify-between ${
                                    selected ? "bg-slate-900/70" : ""
                                  }`}
                                >
                                  <span>{optionValue}</span>
                                  {selected && (
                                    <span className="text-secondary">✓</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-2 align-self-end text-center">
                    <button
                      onClick={() => identifyImageOrText()}
                      disabled={
                        (searchMode === "name" && !textInput.trim()) ||
                        (searchMode === "gps" && !isGpsAvailable) ||
                        loading
                      }
                      className={`w-24 text-center md:w-full glass-action ${
                        searchMode === "name"
                          ? "glass-action--name"
                          : "glass-action--gps"
                      } text-sm md:text-base md:py-2.5 py-2 px-4 rounded-lg transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed font-medium md:mt-4`}
                    >
                      {loading ? "Searching..." : "Search"}
                    </button>
                  </div>
                </div>
              </div>
              {locationStatus && (
                <div className="mt-4 text-sm text-gray-200">
                  {locationStatus}
                </div>
              )}
              {result && relatedQuestions.length > 0 && (
                <div className="relative mt-8 md:mt-0">
                  <div
                    className="absolute top-0 left-0 w-full md:max-h-[200px] max-h-[250px] overflow-y-auto custom-scrollbar mb-3 glass-panel"
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
              <p className="text-white md:text-center xl:text-left text-4xl astoria-font tracking-widest font-bold mb-4 px-4">
                Nearby {category ? category : "Places"}
              </p>
              <div className="max-h-[600px] overflow-auto custom-scrollbar px-4">
                <CustomAccordian
                  data={relatedQuestions}
                  activeIndex={activeIndex}
                  setActiveIndex={setActiveIndex}
                  textInput={textInput}
                  category={category}
                />
              </div>
            </div>
          ) : (
            <div data-aos="fade" data-aos-duration="400">
              <p className="text-white md:text-center xl:text-left text-4xl astoria-font tracking-widest font-bold mb-4 px-4">
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
