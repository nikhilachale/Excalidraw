"use client"; 
import Link from "next/link";
export function AuthPage({ isSignin }: { isSignin: boolean }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-blue-500 mb-4">
          {isSignin ? "Sign In" : "Sign Up"}
        </h1>
        <input
          type="email"
          placeholder="Email"
          className="w-72 p-3 text-neutral-400 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <input
          type="password"
          placeholder="Password"
          className="w-72 p-3 mb-6 border text-neutral-400 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <button
          className="w-72 p-3 bg-black text-white rounded-md hover:bg-gray-800 transition duration-300"
          onClick={() => {
            // Add your sign-in or sign-up logic here
          }}
        >
          {isSignin ? "Sign In" : "Sign Up"}
        </button>
        <p className="mt-4 text-sm text-gray-600">
          {isSignin ? (
            <>
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-500 hover:underline">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/signin" className="text-blue-500 hover:underline">
                Sign In
              </Link>
            </>
          )}
        </p> </div>
    </div>
  );
}