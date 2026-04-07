
async function readStream(stream: ReadableStream): Promise<string> {
    const reader = stream.getReader();
    let result: string = "";

    while (true) {
        const { done, value }: { done: boolean; value?: Uint8Array } =
            await reader.read();
        if (done) break;

        result += new TextDecoder().decode(value);
    }

    return result;
}

export const fetchUrl = async (url: string):Promise<SwaggerDocument> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch JSON from ${url}`);
  }

  const jsonString = await readStream(response.body!);
  return JSON.parse(jsonString);
};
