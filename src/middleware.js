import { NextResponse } from "next/server";
// This function can be marked `async` if using `await` inside
const middleware = () => {
  // console.log("middleware is running!");

  // return NextResponse.json(request)
};

export { middleware };
