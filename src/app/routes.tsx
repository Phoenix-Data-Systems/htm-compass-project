import { createBrowserRouter } from "react-router";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import SurveyPage from "./pages/SurveyPage";
import ThankYouPage from "./pages/ThankYouPage";
import DashboardPage from "./pages/DashboardPage";

export const router = createBrowserRouter([
  { path: "/", Component: HomePage },
  { path: "/assess/:surveyKey", Component: LandingPage },
  { path: "/survey/:token", Component: SurveyPage },
  { path: "/survey/:token/complete", Component: ThankYouPage },
  { path: "/results/:dashboardKey", Component: DashboardPage },
]);
