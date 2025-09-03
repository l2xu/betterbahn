import z from "zod/v4";

const vendoStationSchema = z.object({
	id: z.string(),
	name: z.string().optional(),
});

export type VendoStation = z.infer<typeof vendoStationSchema>;

const vendoStopSchema = z.object({
	id: z.string(),
	name: z.string().optional(),
});

const vendoLocationSchema = z.object({
	id: z.string(),
	name: z.string().optional(),
});

const vendoPriceSchema = z.object({
	amount: z.number(),
	hint: z.string().nullable().optional(),
});

export type VendoPrice = z.infer<typeof vendoPriceSchema>;

const vendoLineSchema = z.object({
	name: z.string(),
	product: z.string().optional(),
	productName: z.string().optional(),
	mode: z.string().or(z.object()).optional(),
});

const originOrDestinationSchema = vendoStationSchema
	.or(vendoStopSchema)
	.or(vendoLocationSchema)
	.optional();

export type VendoOriginOrDestination = z.infer<
	typeof originOrDestinationSchema
>;

const stopoverSchema = z.object({
	arrival: z.unknown().optional(),
	departure: z.unknown().optional(),
	stop: vendoStopSchema.optional(),
	loadFactor: z.unknown(),
});

// Platform information is conditionally provided by the DB API
// Departure/arrival times are independent of duration and always present for transport legs
const vendoLegSchema = z.object({
	origin: originOrDestinationSchema,
	destination: originOrDestinationSchema,
	departure: z.string(), // Always present for transport legs
	line: vendoLineSchema.optional(),
	arrival: z.string(), // Always present for transport legs
	mode: z.string().optional(),
	duration: z.unknown(),
	walking: z.unknown(),
	departurePlatform: z.string().nullable().optional(), // Platform info when available
	arrivalPlatform: z.string().nullable().optional(), // Platform info when available
	delay: z.number().optional(),
	cancelled: z.boolean().optional(),
	stopovers: z.array(stopoverSchema).optional(),
});

export type VendoLeg = z.infer<typeof vendoLegSchema>;

export const vendoJourneySchema = z.object({
	legs: z.array(vendoLegSchema),
	price: vendoPriceSchema.optional(),
	duration: z.unknown().optional(),
});

export type VendoJourney = z.infer<typeof vendoJourneySchema>;

export const vbidSchema = z.object({
	hinfahrtRecon: z.string(),
	hinfahrtDatum: z.string(),
});

export type VbidSchema = z.infer<typeof vbidSchema>;
