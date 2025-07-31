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

          <PageTitle title="Legal" />
          <div className="mt-2 mb-5 pl-4 text-sm">
            <ul className="list-disc space-y-2">
              <li>
                <Link 
                  to="/privacy-policy" 
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Privacy Policy
                </Link>
                {" - "} Learn how we protect your data and privacy
              </li>
              <li>
                <Link 
                  to="/terms-of-service" 
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Terms of Service
                </Link>
                {" - "} Read our terms and conditions for using LogiSlip
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
export default AboutScreen;
