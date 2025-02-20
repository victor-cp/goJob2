export default function Header({ detail }) {
  return (
    <>
      <div>
        <img src={detail.image} alt="" class="p-2" />
      </div>
      <div class="flex flex-col justify-between p-5">
        <p class="px-3">
          {" "}
          {detail.firstName} {detail.lastName}{" "}
          <i class="fa-regular fa-square-check"></i>
        </p>
        <p>
          {" "}
          <i class="fa-solid fa-user px-3"></i>
          {detail.job}
        </p>
        <p>
          {" "}
          <i class="fa-solid fa-wrench px-3"></i>
          {detail.specificJob}
        </p>
        <p>
          {" "}
          <i class="fa-solid fa-medal px-3"></i>
          {detail.numberJobs} Trabajos
        </p>
      </div>
    </>
  );
}
