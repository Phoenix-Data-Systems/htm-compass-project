import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import SurveyPage from "./pages/SurveyPage";
import ThankYouPage from "./pages/ThankYouPage";
import DashboardPage from "./pages/DashboardPage";

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/survey/:token", Component: SurveyPage },
  { path: "/survey/:token/complete", Component: ThankYouPage },
  { path: "/results/:hospitalSlug", Component: DashboardPage },
]);
