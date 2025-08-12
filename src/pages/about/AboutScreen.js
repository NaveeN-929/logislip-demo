import React from "react";
import { Link } from "react-router-dom";
import PageTitle from "../../components/Common/PageTitle";

function AboutScreen() {
  return (
    <div>
      <div className="p-4">
        <div className="bg-white rounded-xl p-3 font-title">
          <PageTitle title="About Me" />
          
          <div className="mt-4 mb-5 flex flex-row items-center">
            <img
              src="https://raw.githubusercontent.com/lwinmoepaing/lwinmoepaing/main/img/gitto.gif"
              className="h-12 mr-3"
              alt="Git"
            />
            <div>
              <h1>  Hi, I'm Logislip  </h1>
              <h1> The Invoice Maker for your Logistics business.</h1>
            </div>
          </div>

          <PageTitle title="Logislip" />
          <div className="mt-2 mb-5 pl-4 text-sm">
            <ul className="list-disc">
              <li> Can Easily Pre-Manage Your Products</li>
              <li> Can Easily Pre-Manage Your Clients</li>
              <li> Can Export PDF </li>
              <li> Can Export Image </li>
            </ul>
          </div>

          <PageTitle title="Build By" />
          <div className="mt-2 mb-5 pl-4 text-sm">
            <ul className="list-disc">
              <li> Framer Motion For each component Animation</li>
              <li> Lottiefiles For Dashboard Widgets Icons</li>
              <li> IndexedDB for Local Storage </li>
              <li> ReactJS </li>
            </ul>
          </div>

          <PageTitle title="Contact" />
          <div className="mt-2 mb-5 pl-1 text-sm">
            <a
              href="tel:+919535354685"
              className="underline cursor-pointer"
              target={"_blank"}
              rel="noreferrer"
            >
              {" "}
              +91-9535354685
            </a>
          </div>

          {/* Legal links moved to the footer and landing page; removing from About for simplicity */}

        </div>
      </div>
    </div>
  );
}
export default AboutScreen;
