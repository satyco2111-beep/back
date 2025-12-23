import Swork from "../models/workModel.js";
import Sprovider from "../models/providerModel.js";


/**
 * @desc    Get all works
 * @route   GET /api/works
 * @access  Public / Admin
 * // /api/works?page=1&limit=10&city=cityId&locality=localityId&minPrice=100&maxPrice=500&title=Design
 */



export const getAllWorks = async (req, res) => {
    try {
        const {
            status,
            service,
            title,
            city,
            local,
            page = 1,
            limit = 6,
        } = req.query;

        const query = {};

        if (status) query.status = status;
        if (service) query.ssrvcid = service;
        if (city) query.sctyid = city;
        if (local) query.sloctyid = local;
        if (title) query.title = { $regex: title, $options: "i" };

        const skip = (page - 1) * limit;

        const total = await Swork.countDocuments(query);
        const works = await Swork.find(query)
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            works,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};



/**
 * @desc    Get a single work by ID
 * @route   GET /api/works/:id
 * @access  Public
 */
export const getSingleWork = async (req, res) => {
    const { id } = req.params;
    const swrid = id;
    try {
        const work = await Swork.findOne({ swrid });
        if (!work) {
            return res.status(404).json({
                success: false,
                message: "Work not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Work fetched successfully",
            work,
        });
    } catch (error) {
        console.error("Error fetching work:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

/**
 * @desc    Register new work
 * @route   POST /api/works/register
 * @access  Public
 */
export const registerWork = async (req, res) => {
    try {
        const { title, description, sctyid, sloctyid, ssrvcid, status, paymentStatus, price, suid, sprovid } = req.body;

        // Basic validation
        if (!title || !sctyid || !sloctyid || !ssrvcid || !suid || !price) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Generate custom work ID
        const swrid = `SWORK-${Date.now()}`;

        // Create and save new work
        const newWork = await Swork.create({ swrid, title, description, sctyid, sloctyid, ssrvcid, status, paymentStatus, price, suid, sprovid });

        // Exclude sensitive data from response if needed
        const workResponse = newWork.toObject();

        return res.status(201).json({
            success: true,
            message: "Work registered successfully",
            work: workResponse,
        });
    } catch (error) {
        console.error("Error registering work:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

/**
 * @desc    Update an existing work
 * @route   PUT /api/works/:id
 * @access  Public / Admin
 */
export const updateWork = async (req, res) => {
    const { id } = req.params;
    const swrid = id;
    const { title, description, sctyid, sloctyid, ssrvcid, status, paymentStatus, price, suid, sprovid } = req.body;

    try {

        const provider = await Sprovider.findOne({ sprovid });
        const payment_dueStaus = provider.payment_due;
        if (status === "ACCEPTED") {
            if (payment_dueStaus === true) {
                return res.status(404).json({
                    success: false,
                    message: "Payment is required before accepting new work.",
                });
            }
        }
        // const work = await Swork.findById(id);
        const work = await Swork.findOne({ swrid });
        if (!work) {
            return res.status(404).json({
                success: false,
                message: "Work not found",
            });
        }

        // Update the work with new data
        work.title = title || work.title;
        work.description = description || work.description;
        work.sctyid = sctyid || work.sctyid;
        work.sloctyid = sloctyid || work.sloctyid;
        work.ssrvcid = ssrvcid || work.ssrvcid;
        work.status = status || work.status;
        work.paymentStatus = paymentStatus || work.paymentStatus;
        work.price = price || work.price;
        work.suid = suid || work.suid;
        work.sprovid = sprovid || work.sprovid;

        await work.save();

        return res.status(200).json({
            success: true,
            message: "Work updated successfully",
            work,
        });
    } catch (error) {
        console.error("Error updating work:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

/**
 * @desc    Delete a work by ID
 * @route   DELETE /api/works/:id
 * @access  Admin
 */
export const deleteWork = async (req, res) => {
    const { id } = req.params;
    const swrid = id;
    try {
        const work = await Swork.findOne({ swrid });
        if (!work) {
            return res.status(404).json({
                success: false,
                message: "Work not found",
            });
        }

        await Swork.deleteOne({ swrid });

        return res.status(200).json({
            success: true,
            message: "Work deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting work:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};



// export const getWorksByUser = async (req, res) => {
//   const { id } = req.params;
//   const works = await Swork.find({ suid: id }).sort({ updatedAt: -1 });
//   res.json({ success: true, works });
// };


// export const getWorksByProvider = async (req, res) => {
//   const { id } = req.params;
//   const works = await Swork.find({ sprovid: id }) .sort({ updatedAt: -1 }) ;
//   res.json({ success: true, works });
// };

export const getWorksByUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 6 } = req.query;

        const query = { suid: id };
        const skip = (page - 1) * limit;

        const total = await Swork.countDocuments(query);
        const works = await Swork.find(query)
            .skip(skip)
            .limit(Number(limit))
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            works,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const getWorksByProvider = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 6 } = req.query;

        const query = { sprovid: id };
        const skip = (page - 1) * limit;

        const total = await Swork.countDocuments(query);
        const works = await Swork.find(query)
            .skip(skip)
            .limit(Number(limit))
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            works,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};





