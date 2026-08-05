import { about } from "./about";
import { experience } from "./experience";
import { home } from "./home";
import { principles } from "./principles";
import { projects } from "./projects";
import { services } from "./services";

export const portfolioContent = { home, about, services, projects, experience, principles };
export type PortfolioContentScope = keyof typeof portfolioContent;
export const portfolioContentScopes = Object.keys(portfolioContent) as PortfolioContentScope[];
