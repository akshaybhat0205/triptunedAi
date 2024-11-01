import React from "react";
import { Accordion, AccordionItem } from "@szhsin/react-accordion";
import { ChevronDown } from "lucide-react";
import "./Accordion.css";

const CustomAccordion = ({ data, activeIndex, setActiveIndex, textInput }) => {
  const handleToggle = (index) => {
    // Toggle the active index on header click
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div data-aos="fade" data-aos-duration="400">
      {" "}
      {/* Apply AOS here */}
      <Accordion>
        {data?.map((item, index) =>
          item.info ? (
            <AccordionItem
              className="bg-gradient-to-r from-primary to-primary/80 border-b border-secondary/90 shadow-md elevated-card p-3 rounded-2xl mb-3"
              key={index}
              header={
                <div
                  className="grid grid-cols-12 w-full items-center"
                  onClick={() => handleToggle(index)}
                >
                  <div className="col-span-11">
                    <div className="flex gap-x-3 items-center mb-1.5">
                      <img
                        src="./file.png"
                        className="p-1 bg-tertiary/80 rounded-full w-9 h-9 object-contain"
                        alt={item.alt}
                      />
                      <h1 className="text-lg font-semibold text-white truncate overflow-hidden whitespace-nowrap">
                        {item.name}
                      </h1>
                    </div>
                  </div>
                  <div className="col-span-1 justify-self-end">
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-300 text-white ${
                        activeIndex === index ? "rotate-180" : "rotate-0"
                      }`}
                    />
                  </div>
                </div>
              }
            >
              <p className="text-gray-200 font-light text-sm mt-2">
                {activeIndex === index && item.info}
              </p>

              <a
                href={item.link + "," + textInput}
                target="_blank"
                rel="noopener noreferrer"
                className=" transition duration-150 ease-in-out"
              >
                <img
                  src="https://img.icons8.com/ios-filled/50/FFFFFF/circled-up-right-2.png"
                  className="mt-4 w-8 h-8"
                />
              </a>
            </AccordionItem>
          ) : null
        )}
      </Accordion>
    </div>
  );
};

export default CustomAccordion;
