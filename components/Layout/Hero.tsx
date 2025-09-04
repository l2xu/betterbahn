import React from "react";
import Image from "next/image";
import train from "../../public/train.jpg";

export const Hero = () => {
	return (
		<section className="my-10 p-6 rounded-3xl min-h-[200px] md:min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden">
			<Image
				src={train}
				alt="Zug auf Schienen - Deutsche Bahn"
				fill
				priority
				sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
				className="object-cover object-center -z-10 rounded-3xl"
				quality={85}
			/>
			<div className="absolute inset-0 bg-black/65 rounded-3xl -z-5"></div>
			{/* Hauptslogan mit hervorgehobenem Text */}
			<div className="text-center text-white uppercase text-3xl md:text-4xl font-bold  tracking-wide leading-normal  ">
				Gleicher Zug, Gleiche Zeit,{" "}
				<span className="font-bold text-primary border-white bg-white px-2 py-1 ">
					Besserer Preis
				</span>
			</div>
		</section>
	);
};

