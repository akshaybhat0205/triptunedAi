import React from "react";
import { Accordion, AccordionItem } from "@szhsin/react-accordion";
import {
  ChevronDown,
  MapPin,
  Landmark,
  Waves,
  Building2,
  Hotel,
  UtensilsCrossed,
  Coffee,
  Clapperboard,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import "./Accordion.css";

const getCategoryIcon = (category = "", item = {}) => {
  const normalizedCategory = (category || "").toLowerCase();

  if (normalizedCategory.includes("beach")) return Waves;
  if (normalizedCategory.includes("monument")) return Landmark;
  if (normalizedCategory.includes("museum")) return Building2;
  if (normalizedCategory.includes("holy")) return Sparkles;
  if (normalizedCategory.includes("hotel")) return Hotel;
  if (normalizedCategory.includes("restaurant")) return UtensilsCrossed;
  if (normalizedCategory.includes("cafe")) return Coffee;
  if (normalizedCategory.includes("cinema")) return Clapperboard;
  if (normalizedCategory.includes("club")) return PartyPopper;

  const textToCheck = [item?.name || "", item?.info || "", item?.description || ""]
    .join(" ")
    .toLowerCase();

  if (/(beach|shore|coast|sea|ocean|wave|sun|sand|island|resort)/.test(textToCheck)) {
    return Waves;
  }
  if (/(monument|fort|palace|temple|cathedral|church|tower|ruin|historic)/.test(textToCheck)) {
    return Landmark;
  }
  if (/(museum|gallery|art|exhibition)/.test(textToCheck)) {
    return Building2;
  }
  if (/(holy|spiritual|sacred|pilgrimage|shrine|mosque)/.test(textToCheck)) {
    return Sparkles;
  }
  if (/(cafe|coffee|tea|bakery)/.test(textToCheck)) {
    return Coffee;
  }
  if (/(restaurant|food|dining|eatery|bar|pub)/.test(textToCheck)) {
    return UtensilsCrossed;
  }
  if (/(hotel|stay|accommodation|inn)/.test(textToCheck)) {
    return Hotel;
  }
  if (/(cinema|movie|theater|theatre|screen)/.test(textToCheck)) {
    return Clapperboard;
  }
  if (/(club|nightlife|party)/.test(textToCheck)) {
    return PartyPopper;
  }

  return MapPin;
};

const CustomAccordion = ({
  data,
  activeIndex,
  setActiveIndex,
  textInput,
  category,
}) => {
  const handleToggle = (index) => {
    // Toggle the active index on header click
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div data-aos="fade" data-aos-duration="400" >
      {" "}
      {/* Apply AOS here */}
      <Accordion>
        {data?.map((item, index) => {
          const CategoryIcon = getCategoryIcon(category, item);

          return item.info ? (
            <AccordionItem
              className={`glass-item p-3 rounded-2xl mb-3 ${
                activeIndex === index ? "glass-item-open" : ""
              }`}
              key={index}
              buttonProps={{ className: "w-full" }}
              header={
                <div
                  className="grid grid-cols-12 w-full items-center"
                  onClick={() => handleToggle(index)}
                >
                  <div className="col-span-11">
                    <div className="flex gap-x-3 items-center mb-1.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white shadow-sm">
                        <CategoryIcon className="h-5 w-5" />
                      </div>
                      <h1 className="item-title text-lg font-semibold truncate overflow-hidden whitespace-nowrap">
                        {item.name}
                      </h1>
                    </div>
                  </div>
                  <div className="col-span-1 justify-self-end">
                    <ChevronDown
                      className={`chev w-4 h-4 transition-transform duration-300 ${
                        activeIndex === index ? "rotate-180" : "rotate-0"
                      }`}
                    />
                  </div>
                </div>
              }
            >
              <p className="item-body font-light text-sm mt-2">
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
          ) : null;
        })}
      </Accordion>
    </div>
  );
};

export default CustomAccordion;
