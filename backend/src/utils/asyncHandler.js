const asyncHandler = (requestHandler) => {
    return (req , res , next) => {
        Promise.resolve(requestHandler(req , res  , next)).catch((error) => next(error))
    }
};

// Two methods used for asynHandler Promises based and try/catch based.
// One can be used based on the understanding
// used comments for better understanding of higher order funstions. They accept funstion as a parameter and return a function


// const asyncHandler = () => {}
// const asyncHandler = (funct) => {() => {}}
// const asyncHandler = (funct) => async () => {}

// const asyncHandler = (func) => async (req , res , next) => {
//     try {
//         await func(req , res , next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             sucess: false,
//             message: error.message
//         })
//     }
// }

export { asyncHandler };
