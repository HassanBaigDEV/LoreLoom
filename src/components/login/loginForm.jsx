"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import CircularProgress from "@mui/material/CircularProgress";
import OutlinedInput from "@mui/material/OutlinedInput";
import FormHelperText from "@mui/material/FormHelperText";
import Text from "@/components/common/Text";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    loading: {
      primary: "#FFF",
    },
  },
});

export default function LoginForm() {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const router = useRouter();

  const initialValues = {
    email: "",
    password: "",
  };
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Please enter a valid email address.")
      .required("Email is required."),
    password: Yup.string()
      .required("Password is required.")
      .min(8, "Password should be of minimum 8 characters length"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    setError("");
    setSubmitting(true);

    const payload = {
      email: values.email,
      password: values.password,
    };

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 200) {
        const data = await response.json();
        console.log("Login successful:", data);
        router.push("/dashboard");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Sign in failed. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        mx: "auto",
        p: 4,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",

        // bgcolor: "background.paper",
        // boxShadow: 2,
        // borderRadius: 2,
      }}
    >
      <Text weight={600} size={30} style={{ color: "#4F4F4F" }}>
        Welcome Back !
      </Text>

      {/* <Text
        style={{
          fontStyle: "normal",
          fontWeight: 400,
          fontSize: 14,
          color: "#4F4F4F",
        }}
      >
        Hi there! Welcome to Our App
      </Text> */}
      <Text
        style={{
          fontStyle: "italic",
          fontWeight: 400,
          color: "#808080",
          fontSize: 14,
          marginBottom: 20,
          marginTop: 5,
        }}
      >
        Please enter your Email and Password to Login
      </Text>

      {error && (
        <Text color="error" style={{ textAlign: "center" }} gutterBottom>
          {error}
        </Text>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          isSubmitting,
        }) => (
          <Form
            noValidate
            autoComplete="off"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              width: 320,
            }}
          >
            <FormControl sx={{ width: "100%", mt: 2 }} variant="outlined">
              <InputLabel
                htmlFor="email"
                sx={{
                  color: Boolean(errors.email)
                    ? "#f44336"
                    : "rgba(0, 0, 0, 0.6)",
                  "&.Mui-focused": {
                    color: Boolean(errors.email)
                      ? "#f44336 !important"
                      : "#1976d2 !important",
                  },
                }}
              >
                Email
              </InputLabel>

              <OutlinedInput
                fullWidth
                id="email"
                name="email"
                label="Email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.email && Boolean(errors.email)}
                // helperText={touched.email && errors.email}
                margin="normal"
                variant="outlined"
                autoComplete="off"
                // InputLabelProps={{ shrink: true }}
              />
              <FormHelperText
                id="outlined-adornment-password"
                sx={{
                  color: Boolean(errors.email) ? "#f44336" : "None",
                }}
              >
                {errors.email}
              </FormHelperText>
            </FormControl>

            <FormControl sx={{ width: "100%", mt: 2 }} variant="outlined">
              <InputLabel
                htmlFor="outlined-adornment-password"
                sx={{
                  color: Boolean(errors.password)
                    ? "#f44336"
                    : "rgba(0, 0, 0, 0.6)",
                  "&.Mui-focused": {
                    color: Boolean(errors.password)
                      ? "#f44336 !important"
                      : "#1976d2 !important",
                  },
                }}
              >
                Password
              </InputLabel>
              <OutlinedInput
                fullWidth
                id="outlined-adornment-password"
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password && Boolean(errors.password)}
                // helperText={touched.password && errors.password}
                margin="normal"
                variant="outlined"
                // InputLabelProps={{ shrink: true }}
                endAdornment={
                  <InputAdornment
                    position="end"
                    sx={{ cursor: "pointer" }}
                    style={{ backgroundColor: "transparent" }}
                    variant="standard"
                  >
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                      style={{ backgroundColor: "transparent" }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
              />
              <FormHelperText
                id="outlined-adornment-password"
                sx={{
                  color: Boolean(errors.password) ? "#f44336" : "None",
                }}
              >
                {errors.password}
              </FormHelperText>
            </FormControl>

            <div
              style={{
                textAlign: "right",
                marginTop: 2,
                marginBottom: 7,
                width: "100%",
              }}
            >
              <Link
                href="/forgot-password"
                underline="disable"
                style={{ color: "rgba(255, 0, 0, 0.7)", fontSize: 12 }}
              >
                Forgot your password?
              </Link>
            </div>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              style={{ backgroundColor: "rgb(34 197 94)" }}
              type="submit"
              disabled={isSubmitting}
              startIcon={
                isSubmitting && (
                  <CircularProgress size={20} style={{ color: "#fff" }} />
                )
              }
              sx={{ mb: 2 }}
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </Form>
        )}
      </Formik>

      <Text textAlign="center">
        Don’t have an account?{"     "}
        <Link
          href="/register"
          underline="disable"
          style={{ marginLeft: 5, color: "rgb(34 197 94)" }}
        >
          Sign Up
        </Link>
      </Text>
      {/* show error */}
      {error && (
        <Typography color="error" variant="body2" align="center">
          {error}
        </Typography>
      )}
    </div>
  );
}
